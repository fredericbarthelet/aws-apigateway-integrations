# AWS API Gateway Integrations

| ⚠️ **WARNING: Do not use this library in production** ⚠️ |
|---|
| AWS API Gateway Integrations is currently released as a beta developer preview and is intended strictly for feedback purposes only.  <br/>This version is not stable, and significant breaking changes might occur. |

AWS API Gateway REST API natively integrates with 200+ AWS services thanks to its [AWS service integration feature](https://docs.aws.amazon.com/apigateway/latest/developerguide/getting-started-aws-proxy.html).

This package is a library of CDK constructs aiming at improving developer experience while implementing API Gateway AWS service integration.
It's primarly goal is to generate programatically:

- JSON schema generation for API Gateway input validation
- URI configuration for integrated AWS service
- VTL templates from API Gateway integration request and response

This library only supports REST API integrations. HTTP API service integration feature is limited to [only a few services](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-aws-services-reference.html). In additionn, AWS already provides an [integration library made for API Gateway HTTP API](https://docs.aws.amazon.com/cdk/api/v1/docs/aws-apigatewayv2-integrations-readme.html).

## List of available AWS service integrations

- [DynamoDB](./docs/dynamodb.md)
- EventBridge
