import { APIGatewayProxyHandler } from "aws-lambda";
import { ResponseService } from "../services/ResponseService";
import { ApiGatewayManagementApi } from "aws-sdk";
import validator from "validator";
import { DatabaseService } from "../services/DatabaseService";

export const connectSocket: APIGatewayProxyHandler = async (event, context) => {
  const connectionId = event.requestContext.connectionId;
  const stage = event.requestContext.stage;
  const domain = event.requestContext.domainName;

  let db: DatabaseService = new DatabaseService('notifications');
  let item = {
    id: connectionId
  }
  await db.putItem(item);

  let url = `https://${domain}/${stage}`;
  // url = `http://localhost:3001`;
  let payload;

  const apigatewaymanagementapi = new ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: url
  });

  payload = {
    success: true
  };

  await apigatewaymanagementapi
    .postToConnection({
      Data: JSON.stringify(payload),
      ConnectionId: connectionId
    })
    .promise()
    .then(data => {
      console.log("data", data);
      return ResponseService.success("success");
    })
    .catch(error => {
      console.log("error", error);
      return ResponseService.error(error.message, 200);
    });

  return ResponseService.success("success");
};

export const messageSocket: APIGatewayProxyHandler = async (event, context) => {

  // Assign values
  const connectionId = event.requestContext.connectionId;
  const stage = event.requestContext.stage;
  const domain = event.requestContext.domainName;
  let url = `https://${domain}/${stage}`;
  // url = `http://localhost:3001`;

  try {
    const body = JSON.parse(event.body);

    // Validate user
    if(!body.user_id) {
      throw new Error('You must send the user_id')
    }

    if(!validator.isUUID(body.user_id, 4)) {
      throw new Error('User_id must be UUID')
    }

    // Save user id in Notification db
    let db: DatabaseService = new DatabaseService('notifications');
    await db.updateItem(connectionId, {
      user_id: body.user_id
    })

    // Send response to client
    const apigatewaymanagementapi = new ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpoint: url
    });

    let payload = {
      connection_id: connectionId,
      success: true
    };

    await apigatewaymanagementapi
      .postToConnection({
        Data: JSON.stringify(payload),
        ConnectionId: connectionId
      })
      .promise()
      .then(data => {
        return ResponseService.success("success");
      })
      .catch(error => {
        console.log("error", error);
        return ResponseService.success("error");
      });

    return ResponseService.success("success");
  } catch (error) {
    console.log('error', error);
    let payload = {
      success: false
    }

    const apigatewaymanagementapi = new ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpoint: url
    });

    await apigatewaymanagementapi
    .postToConnection({
      Data: JSON.stringify(payload),
      ConnectionId: connectionId
    })
    return ResponseService.error(error.message, error.statusCode);
  }
};

export const disconnectSocket: APIGatewayProxyHandler = async (event, context) => {
  try {
    const connectionId = event.requestContext.connectionId;
  
    let db: DatabaseService = new DatabaseService('notifications');
    console.log('item', connectionId);
    await db.deleteItem(connectionId).then(() => {
      console.log('deleted successfully')
    }).catch((error) => {
      console.log('error', error)
    });
  
    return ResponseService.success("success");
  } catch (error) {
    return ResponseService.error(error.message, error.statusCode);
  }
};
