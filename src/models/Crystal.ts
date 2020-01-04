import { v4} from 'uuid'
import * as moment from 'moment';

export class Crystal {
    id: string; 
    message?: string;
    sender_id: string;
    receiver_id?: string;
    time_created: string;
    constructor(sender_id: string) {
        this.id = v4();
        this.sender_id = sender_id;
        this.time_created = moment().toISOString();
    }

    sendTo(receiver_id: string): void {
        this.receiver_id = receiver_id;
    }
}