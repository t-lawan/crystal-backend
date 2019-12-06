import { v4} from 'uuid'


export class Crystal {
    id: string;
    proverb_id?: string;
    sender_id: string;
    receiver_id?: string;
    sent: boolean = false;
    constructor(sender_id) {
        this.id = v4();
        this.sender_id = sender_id;
    }

    sendTo(receiver_id: string,): void {
        this.receiver_id = receiver_id;
        this.sent = true;
    }
}