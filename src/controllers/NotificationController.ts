import { APIGatewayProxyHandler } from "aws-lambda";
import { ResponseService } from "../services/ResponseService";
import { ApiGatewayManagementApi } from "aws-sdk";
import validator from "validator";
import { DatabaseService } from "../services/DatabaseService";
export const connectSocket: APIGatewayProxyHandler = async (event, context) => {
  const connectionId = event.requestContext.connectionId;
  const stage = event.requestContext.stage;
  const domain = event.requestContext.domainName;

  let db: DatabaseService = new DatabaseService("notifications");
  let item = {
    id: connectionId
  };
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
    // if (!body.user_id || !body.server_id) {
    //   console.log('body', body)
    //   throw new Error("You must send the user_id");
    // }

    let db: DatabaseService = new DatabaseService("notifications");

    if (body.user_id) {
      if(!validator.isUUID(body.user_id, 4)) {
        throw new Error("User_id must be UUID");
      }
      // Save user id in Notification db
      await db.updateItem(connectionId, {
        user_id: body.user_id,
        entity_type: "user"
      });
    } else if (body.server_id) {
      if(!validator.isAlphanumeric(body.server_id)) {
        throw new Error("User_id must be UUID");
      }
    // Save servee id in Notification db
      await db.updateItem(connectionId, {
        user_id: body.server_id,
        entity_type: "server"
      });
    }

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
    console.log("error", error);
    let payload = {
      success: false
    };

    const apigatewaymanagementapi = new ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpoint: url
    });

    await apigatewaymanagementapi.postToConnection({
      Data: JSON.stringify(payload),
      ConnectionId: connectionId
    });
    return ResponseService.error(error.message, error.statusCode);
  }
};

export const disconnectSocket: APIGatewayProxyHandler = async (
  event,
  context
) => {
  try {
    const connectionId = event.requestContext.connectionId;

    let db: DatabaseService = new DatabaseService("notifications");
    console.log("item", connectionId);
    await db
      .deleteItem(connectionId)
      .then(() => {
        console.log("deleted successfully");
      })
      .catch(error => {
        console.log("error", error);
      });

    return ResponseService.success("success");
  } catch (error) {
    return ResponseService.error(error.message, error.statusCode);
  }
};

export const notifyAllUsers: APIGatewayProxyHandler = async (
  event,
  context
) => {
  try {
    // Get new user
    let body = JSON.parse(event.body);
    console.log("event", body);
    if (!body.user) {
      throw new Error("Request is missing username");
    }
    let newUser = body.user;

    // Get all active users
    let activeUsers = [];
    let db: DatabaseService = new DatabaseService("notifications");
    activeUsers = await db.getAllItems();
    activeUsers = activeUsers.filter((us) => {
      return us.entity_type === "user"
    })
    // Send new user to all users
    const apigatewaymanagementapi = new ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpoint: "https://yq4xfakfl7.execute-api.us-east-1.amazonaws.com/dev"
    });
    let payload = {
      user: {
        id: newUser.id,
        username: newUser.username
      }
    };
    activeUsers.forEach(async activeUser => {
      console.log(activeUser);
      await apigatewaymanagementapi.postToConnection({
        Data: JSON.stringify(payload),
        ConnectionId: "xx"
      });
    });

    return ResponseService.success("success");
  } catch (error) {
    return ResponseService.error(error.message, error.statusCode);
  }
};
