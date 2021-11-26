import type { Schema } from "@aws/dynamodb-data-marshaller";
import type { Table } from "@aws-cdk/aws-dynamodb";
import type { Role } from "@aws-cdk/aws-iam";
import type { GetCommandInput, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import type {
  GetItemCommandInput as RawGetItemCommandInput,
  QueryCommandInput as RawQueryCommandInput,
} from "@aws-sdk/client-dynamodb";

import { marshall } from "@aws-sdk/util-dynamodb";
import { AwsIntegration } from "@aws-cdk/aws-apigateway";
import { readFileSync } from "fs";
import { resolve } from "path";
import { Stack } from "@aws-cdk/core";
import { mapValues, pick } from "lodash";

type Command =
  | Omit<GetCommandInput, "TableName">
  | Omit<QueryCommandInput, "TableName">;

export const generateApplicationJsonRequestTemplate = ({
  action,
  command,
  table,
}: {
  action: DynamoDBActions;
  command: Command;
  table: Table;
}): RawGetItemCommandInput | RawQueryCommandInput => {
  let marshalledKeys: string[];
  switch (action) {
    case DynamoDBActions.GetItem:
      marshalledKeys = ["Key"];
      break;
    case DynamoDBActions.Query:
      marshalledKeys = ["ExclusiveStartKey", "ExpressionAttributeValues"];
      break;
    case DynamoDBActions.DeleteItem:
    case DynamoDBActions.UpdateItem:
      marshalledKeys = ["Key", "ExpressionAttributeValues"];
      break;
    case DynamoDBActions.PutItem:
      marshalledKeys = ["Item", "ExpressionAttributeValues"];
      break;
  }

  return {
    TableName: table.tableName,
    ...command,
    ...mapValues(pick(command, marshalledKeys), marshall),
  };
};

export enum DynamoDBActions {
  GetItem = "GetItem",
  PutItem = "PutItem",
  DeleteItem = "Delete",
  UpdateItem = "UpdateItem",
  Query = "Query",
}

type DynamoDBIntegrationProps = {
  table: Table;
  role: Role;
  action: DynamoDBActions;
  schema: Schema;
  command: Command;
};

export class DynamoDBIntegration extends AwsIntegration {
  constructor({
    action,
    schema,
    table,
    role: credentialsRole,
    command,
  }: DynamoDBIntegrationProps) {
    const responseTemplateBody = Object.entries(schema)
      .map(([propertyName, schemaType]) => {
        let attributeValue;
        switch (schemaType.type) {
          case "String":
            attributeValue = "S";
            break;
          case "Number":
            attributeValue = "N";
            break;
          default:
            throw new Error("Unhandled");
        }

        return `"${propertyName}": "$item.${propertyName}.${attributeValue}"`;
      })
      .join(",\n");

    let responseTemplate;
    switch (action) {
      case DynamoDBActions.Query:
        responseTemplate =
          readFileSync(resolve(__dirname, "query_beginning.vtl")).toString() +
          responseTemplateBody +
          readFileSync(resolve(__dirname, "query_end.vtl")).toString();
        break;
      case DynamoDBActions.PutItem:
        responseTemplate = JSON.stringify({
          data: {
            id: "$context.requestId",
          },
        });
        break;
      default:
        responseTemplate = undefined;
    }

    super({
      action,
      service: "dynamodb",
      region: Stack.of(table).region,
      options: {
        credentialsRole,
        requestTemplates: {
          "application/json": JSON.stringify(
            generateApplicationJsonRequestTemplate({
              action,
              command,
              table,
            })
          ),
        },
        integrationResponses: [
          {
            selectionPattern: "200",
            statusCode: action === DynamoDBActions.PutItem ? "201" : "200",
            responseTemplates:
              responseTemplate !== undefined
                ? {
                    "application/json": responseTemplate,
                  }
                : undefined,
          },
        ],
      },
    });
  }
}
