# DynamoDB

## Usage

```ts
import { PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { DynamoDBActions, DynamoDBIntegration } from "aws-apigateway-integrations";
import { AttributeType, Table } from "@aws-cdk/aws-dynamodb";
import { Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { Stack, App } from "@aws-cdk/core";
const app = new App();
const stack = new Stack(app, "TestStack");

const table = new Table(stack, "Table", {
    partitionKey: {
        name: "PartitionKey",
        type: AttributeType.STRING,
    },
});
const role = new Role(stack, "Role", {
    assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
});
const putItemCommand: Omit<PutCommandInput, "TableName"> = {
    Item: {
        PK: "Dog",
        SK: "$context.requestId",
        name: "$input.path('$.name')"
    }
};
const integration = new DynamoDBIntegration({
    action: DynamoDBActions.PutItem,
    command: putItemCommand,
    role,
    table,
});
const api = new RestApi(stack, "RestApi");
api.root.addMethod("GET", integration);
```
