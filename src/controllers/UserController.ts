import { APIGatewayProxyHandler } from 'aws-lambda';
import { ResponseService } from '../services/ResponseService';
import validator from 'validator';
import { User } from '../models/User';
import { DatabaseService } from '../services/DatabaseService';

export const addUser: APIGatewayProxyHandler = async(event, context) => {
    try {
        // Get response
        let user;
        let db: DatabaseService;
        const body = JSON.parse(event.body);

        // Validate username so it's alphanumeric minLength 1 maxLength 20
        if(!body.username) {
            throw new Error('Request is missing username');
        }

        if(!validator.isAlphanumeric(body.username)) {
            throw new Error('The username must alphanumeric');
        }

        if(!validator.isLength(body.username, {min: 1, max: 20})) {
            throw new Error('The username must be between 1 and 20');
        }

        // Check if the username already exists
        db = new DatabaseService('users');
        let result;
        await db.scan({
            username: body.username
        }, true).then((resp) => {
            result = resp.Items;
        });

        if(result.length !== 0) {
            throw new Error('This username already exists')
        }

        // Create User Object
        user = new User(body.username);
        // Add to Database
        await db.putItem(user);
        // Send Response
        return ResponseService.success(user);
    } catch(error) {
        return ResponseService.error(error.message, error.statusCode);

    }
}

export const getUsers: APIGatewayProxyHandler = async(event, context) => {
    try {
        // Use Database Service to retrieve all users
        let users = [];
        let db: DatabaseService;

        db = new DatabaseService('users');
        await db.getAllItems().then((resp) => {
            users = resp.Items
        })
        // Send Response
        return ResponseService.success(users);
    } catch(error) {
        return ResponseService.error(error.message, error.statusCode);
    }
}