import { APIGatewayProxyHandler } from "aws-lambda";
import { ResponseService } from "../services/ResponseService";
import { Crystal } from "../models/Crystal";
import { DatabaseService } from "../services/DatabaseService";
import validator from "validator";
import { User } from "../models/User";
import { ApiGatewayManagementApi } from "aws-sdk";

// Remove this endpoint
export const addCrystal: APIGatewayProxyHandler = async (event, context) => {
  try {
    let crystal: Crystal;
    let db: DatabaseService;
    const body = JSON.parse(event.body);

    // Validating user id is uuid
    if (!body.user_id) {
      throw new Error("Request is missing user_id");
    }

    if (!validator.isUUID(body.user_id, 4)) {
      throw new Error("User_Id must be a UUID");
    }

    //  Create crystal object
    crystal = new Crystal(body.user_id);

    // Add to database
    db = new DatabaseService("crystals");
    await db.putItem(crystal);
    return ResponseService.success(crystal);
  } catch (error) {
    return ResponseService.error(error.message, error.statusCode);
  }
};

export const getCrystalsForUser: APIGatewayProxyHandler = async (
  event,
  context
) => {
  try {
    let db: DatabaseService;
    let crystals;
    // Retrieve user id
    let user_id = event.pathParameters.user_id;

    // Validate user id
    if (!user_id) {
      throw new Error("Request is missing user_id");
    }
    if (!validator.isUUID(user_id, 4)) {
      throw new Error("User_Id must be a UUID");
    }

    db = new DatabaseService("crystals");
    await db
      .scan(
        {
          sender_id: user_id,
          receiver_id: user_id
        },
        false
      )
      .then(resp => {
        crystals = resp.Items;
      });

    return ResponseService.success(crystals);
  } catch (error) {
    return ResponseService.error(error.message, error.statusCode);
  }
};

export const sendCrystalToUser: APIGatewayProxyHandler = async (
  event,
  context
) => {
  try {
    let db: DatabaseService;
    // Receive sender id and receiver id and message
    const body = JSON.parse(event.body);

    // Validate Sender Id
    if (!body.sender_id) {
      throw new Error("Request is missing sender_id");
    }
    if (!validator.isUUID(body.sender_id, 4)) {
      throw new Error("sender_id must be a UUID");
    }

    // Validate Receiver Id
    if (!body.receiver_id) {
      throw new Error("Request is missing receiver_id");
    }
    if (!validator.isUUID(body.receiver_id, 4)) {
      throw new Error("receiver_id must be a UUID");
    }

    // Validate and sanitize message
    if (body.message) {
      if (!validator.isAscii(body.message)) {
        throw new Error("Message is invalid");
      }
      body.message = validator.escape(body.message);
    }

    //Get Receiver User from db
    db = new DatabaseService("users");
    let receiverUser: User;
    // db.updateTableName('users');
    await db.getItem(body.receiver_id).then(resp => {
      receiverUser = resp.Item;
    });

    if (!receiverUser) {
      throw new Error("receiver user does not exist");
    }

    // Get Sender User from db
    let senderUser: User;
    await db.getItem(body.sender_id).then(resp => {
      senderUser = resp.Item;
    });

    if (!senderUser) {
      throw new Error("sender user does not exist");
    }

    // Create crystal
    let crystal = new Crystal(senderUser.id);
    crystal.receiver_id = receiverUser.id;
    if (body.message) {
      crystal.message = body.message;
    }

    // Update connections for both users
    if (!receiverUser.connections.includes(senderUser.id)) {
      // let object = {
      //     user_id: senderUser.id,
      //     sender: false,
      //     crystal_id: crystal.id
      // }
      receiverUser.connections.push(senderUser.id);
    }

    if (!senderUser.connections.includes(receiverUser.id)) {
      // let object = {
      //     user_id: receiverUser.id,
      //     sender: true,
      //     crystal_id: crystal.id
      // }
      senderUser.connections.push(receiverUser.id);
    }

    await db.putItem(receiverUser);
    await db.putItem(senderUser);

    db.updateTableName("crystals");
    await db.putItem(crystal);

    // Check if user exists in notifications table then update if true
    db.updateTableName("notifications");
    let sessions;
    await db
      .scan(
        {
          user_id: receiverUser.id
        },
        true
      )
      .then(resp => {
        sessions = resp.Items;
      });

    const apigatewaymanagementapi = new ApiGatewayManagementApi({
      apiVersion: "2018-11-29",
      endpoint: "https://yq4xfakfl7.execute-api.us-east-1.amazonaws.com/dev"
    });
    let payload;

    if (sessions.length > 0) {
      payload = {
        crystal: crystal,
        success: true
      };

      await apigatewaymanagementapi
        .postToConnection({
          Data: JSON.stringify(payload),
          ConnectionId: sessions[0].id
        })
        .promise()
        .then(data => {
          return ResponseService.success(crystal);
        });
    }
    // Check if server is connected
    let server;
    await db
      .scan(
        {
          entity_type: "server"
        },
        true
      )
      .then(res => {
        server = res.Items;
      });

    if (server.length > 0) {
      payload = {
        success: true
      };

      await apigatewaymanagementapi
      .postToConnection({
        Data: JSON.stringify(payload),
        ConnectionId: server[0].id
      })
      .promise()
      .then(data => {
        console.log('Successfully sent to server')
      });

    }
    return ResponseService.success(crystal);
  } catch (error) {
    return ResponseService.error(error.message, error.statusCode);
  }
};
