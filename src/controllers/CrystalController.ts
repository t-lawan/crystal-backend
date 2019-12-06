import { APIGatewayProxyHandler } from 'aws-lambda';
import { ResponseService } from '../services/ResponseService';
import { Crystal } from '../models/Crystal';
import { DatabaseService } from '../services/DatabaseService';
import validator from 'validator';

export const addCrystal: APIGatewayProxyHandler = async (event, context) => {
    try {
        let crystal;
        let db: DatabaseService;
        const body = JSON.parse(event.body);

        // Validating user id is uuid
        if(!body.user_id) {
            throw new Error('Request is missing user_id');
        }

        if(!validator.isUUID(body.user_id, 4)) {
            throw new Error('User_Id must be a UUID');
        }


        //  Create crystal object
        crystal = new Crystal(body.user_id);

        // Add to database
        db = new DatabaseService('crystals');
        await db.putItem(crystal);
        return ResponseService.success(crystal);
    } catch (error) {
        return ResponseService.error(error.message, error.statusCode);
    }
}