import axios, {AxiosResponse} from "axios";
import {JSEffects} from "./JSEffects";
import {byTextAscending} from "../Utils";

export class AllPledgesTester {

    public run() {
        let callString = "http://192.168.0.21:8080/all_pledges_service"
        // let callString = "http://localhost:8080/all_pledges_service"
        console.log("getting pledges")
        axios.get(callString)
            .then(response => this.dealWith(response))
            .catch(error => this.error(error))
            .then(() => this.default());

        let i = 0

    }

    public dealWith(response: AxiosResponse) {

        let pledgeTotal: number = 0
        let messageString: string = ""
        let messageList: string[] = [];
        let pledges = response.data;

        // pledges.sort(byTextAscending((item: {}) => item["serverTimeString"]))
        pledges = pledges.reverse()

        for (let item of pledges) {
            let name = item["name"]
            let pledge = item["pledge"]
            let dateString = item["serverTimeString"]
            let date = new Date(dateString);
            let token = `${name}: ${pledge}\n`;
            messageString += token
            messageList.push(token)
            pledgeTotal += +pledge
            let i = 0;
        }
        console.log(messageString)
    }

    public error(error) {
        console.log(error)
    }

    public default() {
        console.log("default")
    }
}

new AllPledgesTester().run()
