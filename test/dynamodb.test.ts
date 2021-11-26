import { Template } from "@aws-cdk/assertions";
import { RestApi } from "@aws-cdk/aws-apigateway";
import { AttributeType, Table } from "@aws-cdk/aws-dynamodb";
import { Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import * as cdk from "@aws-cdk/core";
import { Stack } from "@aws-cdk/core";
import {
  DynamoDBActions,
  DynamoDBIntegration,
  generateApplicationJsonRequestTemplate,
} from "../lib/index";

describe("DynamoDBIntegration", () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");

  const table = new Table(stack, "Table", {
    partitionKey: {
      name: "PartitionKey",
      type: AttributeType.STRING,
    },
  });
  const role = new Role(stack, "Role", {
    assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
  });
  const integration = new DynamoDBIntegration({
    table,
    role,
    action: DynamoDBActions.GetItem,
    command: {
      Key: {
        [table.schema().partitionKey.name]: "Value",
      },
    },
    schema: {},
  });

  const api = new RestApi(stack, "RestApi");
  api.root.addMethod("GET", integration);

  const template = Template.fromStack(stack);

  it("main", () => {
    template.hasResourceProperties("AWS::ApiGateway::Method", {
      Integration: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        Credentials: Stack.of(stack).resolve(role.roleArn),
        Type: "AWS",
      },
    });
  });

  describe("generateApplicationJsonRequestTemplate", () => {
    test.each([
      {
        action: DynamoDBActions.GetItem,
        command: {
          Key: {
            Id: "Value",
          },
        },
        expectedRequestTemplate: {
          TableName: table.tableName,
          Key: {
            Id: {
              S: "Value",
            },
          },
        },
      },
      {
        action: DynamoDBActions.Query,
        command: {
          ExclusiveStartKey: {
            Id: "Value",
          },
        },
        expectedRequestTemplate: {
          TableName: table.tableName,
          ExclusiveStartKey: {
            Id: {
              S: "Value",
            },
          },
        },
      },
      {
        action: DynamoDBActions.Query,
        command: {
          ExpressionAttributeValues: {
            ":value": "Value",
          },
        },
        expectedRequestTemplate: {
          TableName: table.tableName,
          ExpressionAttributeValues: {
            ":value": {
              S: "Value",
            },
          },
        },
      },
      {
        action: DynamoDBActions.Query,
        command: {
          ExclusiveStartKey: {
            Id: "Value",
          },
          ExpressionAttributeValues: {
            ":value": "Value",
          },
        },
        expectedRequestTemplate: {
          TableName: table.tableName,
          ExclusiveStartKey: {
            Id: {
              S: "Value",
            },
          },
          ExpressionAttributeValues: {
            ":value": {
              S: "Value",
            },
          },
        },
      },
    ])(
      "for $action with command $command",
      ({ action, command, expectedRequestTemplate }) => {
        expect(
          generateApplicationJsonRequestTemplate({
            action,
            command,
            table,
          })
        ).toEqual(expectedRequestTemplate);
      }
    );
  });
});
