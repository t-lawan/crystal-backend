import { APIGatewayProxyHandler } from 'aws-lambda';
import { ResponseService } from '../services/ResponseService';
import validator from 'validator';
import { User } from '../models/User';

export const addUser: APIGatewayProxyHandler = async(event, context) => {
    try {

        // Get response
        let user;
        const body = JSON.parse(event.body);

        // Validate username so it's alphanumeric minLength 1 maxLength 20
        if(!body.username) {
            throw new Error('This request should have a username property');
        }

        if(!validator.isAlphanumeric(body.username)) {
            throw new Error('The username must alphanumeric');
        }

        if(!validator.isLength(body.username, {min: 1, max: 20})) {
            throw new Error('The username must be between 1 and 20');
        }

        // Create User Object
        user = new User(body.username);
        // Add to Database

        // Send Response
        return ResponseService.success(user);
    } catch(error) {
        return ResponseService.error(error.message, error.statusCode);

    }
}