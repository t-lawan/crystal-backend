import { APIGatewayProxyHandler } from "aws-lambda";
import { ResponseService } from "../services/ResponseService";
import { ApiGatewayManagementApi } from "aws-sdk";
export const handleNotification: APIGatewayProxyHandler = async (
  event,
  context
) => {
  const connectionId = event.requestContext.connectionId;
  const stage = event.requestContext.stage;
  const domain = event.requestContext.domainName;
  const eventType = event.requestContext.eventType;
  let url = `${domain}/${stage}`;
  let payload;
  const apigatewaymanagementapi = new ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: url
  });

  if (eventType == "CONNECT") {
    payload = {
      hello: "Connect"
    };

    await apigatewaymanagementapi.postToConnection(
      {
        Data: JSON.stringify(payload),
        ConnectionId: connectionId
      },
      (err, data) => {
        if (err) {
          console.log("error", err);
        //   return ResponseService.error(err.message, err.statusCode);
        } else {
          console.log("data", data);
        //   return ResponseService.success(data);
        }
      }
    );
  } else {
    payload = {
      hello: "Thomas"
    };

    await apigatewaymanagementapi.postToConnection(
      {
        Data: JSON.stringify(payload),
        ConnectionId: connectionId
      },
      (err, data) => {
        if (err) {
          console.log("error", err);
        //   return ResponseService.error(err.message, err.statusCode);

        } else {
          console.log("data", data);
        //   return ResponseService.success(data);

        }
      }
    );
  }

  return {
      statusCode: 200
  };
};
