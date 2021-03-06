import { APIGatewayProxyHandler } from "aws-lambda";
import { ResponseService } from "../services/ResponseService";
import validator from "validator";
import { User } from "../models/User";
import { DatabaseService } from "../services/DatabaseService";
import { ApiGatewayManagementApi, Lambda } from "aws-sdk";

export const addUser: APIGatewayProxyHandler = async (event, context) => {
  try {
    // Get response
    let user;
    let db: DatabaseService;
    const body = JSON.parse(event.body);

    // Validate username so it's alphanumeric minLength 1 maxLength 20
    if (!body.username) {
      throw new Error("Request is missing username");
    }

    if (!validator.isAlphanumeric(body.username)) {
      throw new Error("The username must alphanumeric");
    }

    if (!validator.isLength(body.username, { min: 1, max: 20 })) {
      throw new Error("The username must be between 1 and 20");
    }

    // Check if the username already exists
    db = new DatabaseService("users");
    let result;
    await db
      .scan(
        {
          username: body.username
        },
        true
      )
      .then(resp => {
        result = resp.Items;
      });

    if (result.length !== 0) {
      throw new Error("This username already exists");
    }

    // Create User Object
    user = new User(body.username);
    // Add to Database
    await db.putItem(user);

    // Invoke lambda
    let lambda = new Lambda();
    let params = {
      FunctionName: 'crystal-backend-dev-notifyAllUsers',
      InvokeArgs: JSON.stringify(user),
    };
    await lambda.invokeAsync(params, (err, data) => {
      if(err) {
        console.log('err',err);
      }
      console.log('d', data);
    });
    // Send Response
    return ResponseService.success(user);
  } catch (error) {
    return ResponseService.error(error.message, error.statusCode);
  }
};

// create user login

export const getUser: APIGatewayProxyHandler = async (event, context) => {
  try {
    const username = event.pathParameters.username;

    // Validate username so it's alphanumeric minLength 1 maxLength 20
    if (!username) {
      throw new Error("Request is missing username");
    }

    if (!validator.isAlphanumeric(username)) {
      throw new Error("The username must alphanumeric");
    }

    if (!validator.isLength(username, { min: 1, max: 20 })) {
      throw new Error("The username must be between 1 and 20");
    }

    let user: User;
    let db: DatabaseService;

    db = new DatabaseService("users");
    await db
      .scan(
        {
          username: username
        },
        true
      )
      .then(resp => {
        user = resp.Items[0];
      });

    return ResponseService.success(user);
  } catch (error) {
    return ResponseService.error(error.message, error.statusCode);
  }
};
export const getUsers: APIGatewayProxyHandler = async (event, context) => {
  try {
    // Use Database Service to retrieve all users
    let users: User[] = [];
    let db: DatabaseService;

    db = new DatabaseService("users");
    await db.getAllItems().then(resp => {
      users = resp.Items;
    });

    let mappedUsers = users.map(user => {
      return {
        id: user.id,
        username: user.username
      };
    });
    // Send Response
    return ResponseService.success(mappedUsers);
  } catch (error) {
    return ResponseService.error(error.message, error.statusCode);
  }
};
