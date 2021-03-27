import axios, {AxiosResponse} from 'axios';
import {JSEffects} from "./JSEffects"

interface IPost {
    userId: number;
    id?: number;
    title: string;
    body: string;
}


// const App: React.SFC = () => {}

export class AllPledgesRefresher {

     public setup() {
        this.totalDiv = document.getElementById("total_div") as HTMLDivElement;
        this.pledgesDiv = document.getElementById("pledges_div") as HTMLDivElement;
        this.shortfallDiv = document.getElementById("shortfall_div") as HTMLDivElement;
        setInterval(() => this.run(), 2000);
         // window['doRealistic'].call();
    }

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
        let pledges = response.data;
        pledges = pledges.reverse()
        for (let item of pledges) {
            let name = item["name"]
            let pledge = item["pledge"]
            messageString += `${name} - ${pledge}\n`
            pledgeTotal += +pledge
            let i = 0;
        }
        console.log(messageString)
        if (this.pledgesDiv != undefined) {
            this.pledgesDiv.innerText = messageString
        }
        if (this.totalDiv != undefined) {
            this.totalDiv.innerText = `Total pledged - £${pledgeTotal}`
        }
        if (this.shortfallDiv != undefined) {
            let ask = 200;
            let message = "not_set"
            if (ask > pledgeTotal) {
                message = `Shortfall - £${ask - pledgeTotal}`
                this.shortfallDiv.innerText = message
                this.shortfallDiv.setAttribute("style", "font-size: 24pt;font-weight: bold;color:red;");
                this.passedThreshold = false;
            } else {
                message = `Over - £${pledgeTotal - ask}`
                this.shortfallDiv.innerText = message
                this.shortfallDiv.setAttribute("style", "font-size: 24pt;font-weight: bold;color:black;");

                if (!this.passedThreshold) {
                    // doFireworks();
                    // doRealistic();
                    new JSEffects().schoolPride();
                    // new JSEffects().doRealFireworks();
                    // new JSEffects().doRealistic();
                    // new JSEffects().doFireworks();
                    this.passedThreshold = true;
                }
            }
        }
    }

    public error(error) {
        console.log(error)
    }

    public default() {
        console.log("default")
    }

    private pledgesDiv: HTMLDivElement;
    private totalDiv: HTMLDivElement;
    private shortfallDiv: HTMLDivElement;
    private passedThreshold: boolean = false;

}
