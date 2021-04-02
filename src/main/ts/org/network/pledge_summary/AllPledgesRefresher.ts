import axios, {AxiosResponse} from 'axios';
import {JSEffects} from "./JSEffects"
import {} from "jquery"
import {byTextAscending} from "../Utils";
import moment = require("moment");
import {format} from "ts-date";

export class Pledge {
    name: string;
    pledge: number;
    creationTime: Date;

    constructor(name: string, pledge: number, creationTime: Date) {
        this.name = name;
        this.pledge = pledge;
        this.creationTime = creationTime;
    }
}

export class AllPledgesRefresher {

     public setup() {
         this.totalDiv = document.getElementById("total_div") as HTMLDivElement;
         this.pledgesDiv = document.getElementById("pledges_div") as HTMLDivElement;
         this.pledgesContainer = document.getElementById("pledge_container") as HTMLUListElement;
         this.recentPledgesDiv = document.getElementById("recent_pledges_div") as HTMLDivElement;
         this.shortfallDiv = document.getElementById("shortfall_div") as HTMLDivElement;
         document.addEventListener("keydown", (e) => this.myFunc(e))
         this.recentPledgesQueue = [];
         this.allPledgesDict = {};
         this.latestPledgeTime = null;
         setInterval(() => this.run(), 2000);
    }

    public run() {

        let sinceTime = "all"
        if (this.latestPledgeTime != null) {
            sinceTime = this.latestPledgeTime;
        }

        let callString = `http://192.168.0.21:8080/all_pledges_service?sinceTime=${sinceTime}`
        // let callString = "http://localhost:8080/all_pledges_service"
        console.log("getting pledges")
        axios.get(callString)
            .then(response => this.dealWith(response))
            .catch(error => this.error(error))
            .then(() => this.default());
    }

    public myFunc(evt : KeyboardEvent) {
         console.log(evt);
    }

    public dealWith(response: AxiosResponse) {

        // let allPLedgesList: string[] = [];
        let pledges = response.data;

        let newPledges: Pledge[] = []

        // pledges.sort(byTextAscending((item: {}) => item["serverTimeString"]))
        // pledges = pledges.reverse()

        let now = new Date().getTime()
        for (let pledge of this.recentPledgesQueue.reverse()) {
            if (now - pledge.creationTime.getTime() < 10000) {
                newPledges.push(pledge)
            }
        }

        for (let item of pledges) {

            let name = item["name"]
            let pledge = item["pledge"]
            let dateString = item["serverTimeString"]

            let dateTime = new Date()
            let newPledge = new Pledge(name, pledge, dateTime);
            console.log(`${newPledge.name}:${newPledge.pledge} - ${format(newPledge.creationTime, "yy:MM:dd:HH:mm:ss:SS")}\n`)
            newPledges.push(newPledge)
            this.addNewPledge(newPledge)

            this.latestPledgeTime = dateString;
            let i = 0;
        }

        this.recentPledgesQueue = newPledges

        let recentPledgesString = ""
        for (let pledge of this.recentPledgesQueue.reverse()) {
            recentPledgesString += `${pledge.name}:${pledge.pledge} `;
        }

        this.recentPledgesDiv.innerHTML = recentPledgesString

        let pledgeTotal: number = 0

        for (let userName in this.allPledgesDict) {

            let pledge: number = this.allPledgesDict[userName];

            let token = `${userName}: ${pledge}\n`;

            pledgeTotal += pledge;

            let liPledgeElement = document.getElementById(userName) as HTMLLIElement

            if (liPledgeElement == undefined) {
                liPledgeElement = document.createElement('li') as HTMLLIElement
                liPledgeElement.setAttribute("style", "padding-right: 15px;border: solid black")
                liPledgeElement.setAttribute("id", userName)
                this.pledgesContainer.appendChild(liPledgeElement)
                this.pledgesContainer.appendChild(document.createElement('li'))//a space
            }

            liPledgeElement.innerText = token
        }

        this.totalDiv.innerText = `Total pledged - £${pledgeTotal}`
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

    private addNewPledge(newPledge: Pledge) {
        if (this.allPledgesDict.hasOwnProperty(newPledge.name)) {
            this.allPledgesDict[newPledge.name] += newPledge.pledge
        } else {
            this.allPledgesDict[newPledge.name] = newPledge.pledge;
        }
    }

    public error(error) {
        console.log(error)
    }

    public default() {
        console.log("default")
    }

    private recentPledgesQueue: Pledge[] = [];
    private allPledgesDict: {[key: string]: number} = {};
    private passedThreshold: boolean = false;
    private latestPledgeTime: string = null;

    private pledgesDiv: HTMLDivElement;
    private recentPledgesDiv: HTMLDivElement;
    private pledgesContainer: HTMLUListElement;
    private totalDiv: HTMLDivElement;
    private shortfallDiv: HTMLDivElement;
}
