import { APIGatewayProxyHandler } from 'aws-lambda';
import { ResponseService } from '../services/ResponseService';
import { Crystal } from '../models/Crystal';
import { DatabaseService } from '../services/DatabaseService';
import validator from 'validator';
import { User } from '../models/User';
import * as moment from 'moment';

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

export const getCrystalsForUser: APIGatewayProxyHandler = async (event, context) => {
    try {
        let db: DatabaseService;
        let crystals;
        // Retrieve user id
        let user_id = event.pathParameters.user_id;

        // Validate user id
        if(!user_id) {
            throw new Error('Request is missing user_id');
        }
        if(!validator.isUUID(user_id, 4)) {
            throw new Error('User_Id must be a UUID');
        }

        db = new DatabaseService('crystals');
        await db.scan({
            sender_id: user_id,
            receiver_id: user_id
        }, false).then((resp) => {
            crystals = resp.Items;
        });

        return ResponseService.success(crystals);
    } catch (error) {
        return ResponseService.error(error.message, error.statusCode);        
    }

}

export const sendCrystalToUser: APIGatewayProxyHandler = async (event, context) => {
    try {
        let db: DatabaseService;
        // Receive crystal id and receiver id
        const body = JSON.parse(event.body);

        // Validate Crystal Id
        if(!body.crystal_id) {
            throw new Error('Request is missing crystal_id');
        }

        if(!validator.isUUID(body.crystal_id, 4)) {
            throw new Error('crystal_id must be a UUID');
        }
        // Validate Receiver Id

        if(!body.receiver_id) {
            throw new Error('Request is missing receiver_id');
        }

        if(!validator.isUUID(body.receiver_id, 4)) {
            throw new Error('receiver_id must be a UUID');
        }

        // Get crystal from db
        db = new DatabaseService('crystals');
        let crystal: Crystal;
        await db.getItem(body.crystal_id).then((resp) => {
            crystal = resp.Item;
        });
        
        // Check if crystal exists
        if(!crystal) {
            throw new Error('Crystal does not exist')
        }

        //Get Receiver User from db
        let receiverUser: User;
        db.updateTableName('users');
        await db.getItem(body.receiver_id).then((resp) => {
            receiverUser = resp.Item;
        });

        // Get Send User from db
        let senderUser: User;
        await db.getItem(crystal.sender_id).then((resp) => {
            senderUser = resp.Item;
        })
        
        // Update crystal
        crystal.receiver_id = receiverUser.id;
        crystal.sent = true;
        crystal.time_sent = moment().toISOString();
        // crystal.sendTo(receiverUser.id);

        // Update connections for both users
        receiverUser.no_of_connections++;
        senderUser.no_of_connections++;

        await db.putItem(receiverUser);
        await db.putItem(senderUser);

        db.updateTableName('crystals');
        await db.putItem(crystal);

        return ResponseService.success(crystal);

    } catch (error) {
        return ResponseService.error(error.message, error.statusCode);                
    }
}