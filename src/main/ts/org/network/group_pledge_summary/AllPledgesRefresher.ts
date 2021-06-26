import axios, {AxiosResponse} from 'axios';
import {JSEffects} from "./JSEffects"
import {} from "jquery"
import {byTextAscending} from "../Utils";
import moment = require("moment");
import {format} from "ts-date";
import {Constants} from "../common/Constants";

export class PledgeTS {
    name: string;
    pledge: number;
    creationTime: Date;
    newPledge: boolean

    constructor(name: string,
                pledge: number,
                newPledge: boolean,
                creationTime: Date) {
        this.name = name;
        this.pledge = pledge;
        this.creationTime = creationTime;
        this.newPledge = newPledge;
    }

}

export class ProjectTS {

    projectId: number;
    projectName: string;
    projectOrganisation: string;
    projectSponsor: string;
    projectStatus: string;

    constructor(projectId: number,
                projectName: string,
                projectOrganisation: string,
                projectSponsor: string,
                projectStatus: string) {

        this.projectId = projectId;
        this.projectName = projectName;
        this.projectOrganisation = projectOrganisation;
        this.projectSponsor = projectSponsor;
        this.projectStatus = projectStatus;
    }
}
export class AllPledgesRefresher {

     public setup() {
         this.totalDiv = document.getElementById("total_div") as HTMLDivElement;
         this.pledgesDiv = document.getElementById("pledges_div") as HTMLDivElement;
         this.pledgesContainer = document.getElementById("pledge_container") as HTMLUListElement;
         this.recentPledgesDiv = document.getElementById("recent_pledges_div") as HTMLDivElement;
         this.shortfallDiv = document.getElementById("shortfall_div") as HTMLDivElement;
         this.projectIdDiv = document.getElementById("project_id_div") as HTMLDivElement;
         this.projectDetailsDiv = document.getElementById("project_details_div") as HTMLDivElement;
         this.projectSponsorDiv = document.getElementById("project_sponsor_div") as HTMLDivElement;
         this.projectStatusDiv = document.getElementById("project_status_div") as HTMLDivElement;
         this.projectBackButton = document.getElementById("project_back_button") as HTMLButtonElement;
         this.projectForwardButton = document.getElementById("project_forward_button") as HTMLButtonElement;
         this.recentPledgesQueue = [];
         this.allPledgesDict = {};
         this.latestPledgeTime = null;

         this.projectForwardButton.addEventListener("click", (event) => {this.incrementProject()})
         this.projectBackButton.addEventListener("click", (event) => {this.decrementProject()})

         this.populateProjectsFromServer();
         setInterval(() => this.runPledgeUpdater(), 3000);
    }

    public populateProjectsFromServer() {
        let callString = `http://${Constants.SERVER_IP}:${Constants.SERVER_PORT}/all_projects`
        console.log("getting projects")
        axios.get(callString)
            .then(response => this.populateProjects(response))
            .catch(error => this.error(error))
            .then(() => this.default());
    }

    private populateProjects(response: AxiosResponse) {

        this.allProjects = []
        let items = response.data

        for (let item of items) {

            let name = item["name"]
            let id = item["id"]
            let organisation = item["organisation"]
            let sponsor = item["sponsor"]
            let status = item["status"]

            let project = new ProjectTS(id,
                name,
                organisation,
                sponsor,
                status);

            this.allProjects.push(project);
        }

        this.selectFirstProject();
    }

    private selectFirstProject() {
        this.selectProject(0)
    }

    private incrementProject(){
        if (this.selectedProjectIndex == this.allProjects.length-1) {
            this.selectedProjectIndex = 0
        } else {
            this.selectedProjectIndex += 1
        }
        this.selectProject(this.selectedProjectIndex)
    }

    private decrementProject() {
        if (this.selectedProjectIndex == 0) {
            this.selectedProjectIndex = this.allProjects.length-1
        } else {
            this.selectedProjectIndex -= 1
        }
        this.selectProject(this.selectedProjectIndex)
    }

    private selectProject(index: number) {
        console.log("selecting project " + index)
        let project = this.allProjects[index]
        this.selectedProject = project
        this.projectIdDiv.innerText = project.projectName
        this.projectDetailsDiv.innerText = `${project.projectId} - ${project.projectOrganisation}`
        this.projectSponsorDiv.innerText = project.projectSponsor
        this.projectStatusDiv.innerText = project.projectStatus
        this.clearPledges()
    }

    private clearPledges() {
        this.recentPledgesQueue = [];
        this.allPledgesDict = {};
        this.passedThreshold = false;
        this.latestPledgeTime = null;

        this.recentPledgesDiv.innerHTML = ""
        this.pledgesContainer.innerHTML = ""
        this.totalDiv.innerHTML = ""
        this.shortfallDiv.innerHTML = ""
    }

    public runPledgeUpdater() {

        let sinceTime = "all"
        if (this.latestPledgeTime != null) {
            sinceTime = this.latestPledgeTime;
        }

        let projectId = this.selectedProject.projectId

        let callString = `http://${Constants.SERVER_IP}:${Constants.SERVER_PORT}/all_pledges?projectId=${projectId}&sinceTime=${sinceTime}`
        // let callString = "http://localhost:8080/all_pledges_service"
        console.log("getting pledges")
        axios.get(callString)
            .then(response => this.updatePledges(response))
            .catch(error => this.error(error))
            .then(() => this.default());
    }

    public updatePledges(response: AxiosResponse) {

        // let allPLedgesList: string[] = [];
        let pledges = response.data;

        let newPledges: PledgeTS[] = []

        // pledges.sort(byTextAscending((item: {}) => item["serverTimeString"]))
        // pledges = pledges.reverse()

        let now = new Date().getTime()
        for (let pledge of this.recentPledgesQueue.reverse()) {
            if (now - pledge.creationTime.getTime() < 10000) {
                pledge.newPledge = false;
                newPledges.push(pledge)
            }
        }

        for (let item of pledges) {

            let name = item["name"]
            let pledge = item["pledge"]
            let dateString = item["serverTimeString"]

            let dateTime = new Date()
            let newPledge = new PledgeTS(name, pledge, true, dateTime);
            console.log(`${newPledge.name}:${newPledge.pledge} - ${format(newPledge.creationTime, "yy:MM:dd:HH:mm:ss:SS")}\n`)
            newPledges.push(newPledge)
            this.addNewPledge(newPledge)

            this.latestPledgeTime = dateString;
            let i = 0;
        }

        this.recentPledgesQueue = newPledges

        let recentPledgesString = ""
        for (let pledge of this.recentPledgesQueue.reverse()) {
            if (pledge.newPledge) {
                recentPledgesString += `<span style="color: crimson;font-weight: bold">${pledge.name}:${pledge.pledge}</span> `;
            } else {
                recentPledgesString += `<span style="color: black">${pledge.name}:${pledge.pledge}</span> `;
            }
        }

        this.recentPledgesDiv.innerHTML = recentPledgesString

        // ALL PLEDGES

        let pledgeTotal: number = 0

        for (let userName in this.allPledgesDict) {

            let pledge: number = this.allPledgesDict[userName];

            let token = `${userName}: ${pledge}\n`;

            pledgeTotal += pledge;

            let liPledgeElement = document.getElementById(userName) as HTMLLIElement

            if (liPledgeElement == undefined) {
                liPledgeElement = document.createElement('li') as HTMLLIElement
                liPledgeElement.setAttribute("style", "li")
                liPledgeElement.setAttribute("id", userName)
                this.pledgesContainer.appendChild(liPledgeElement)
                // this.pledgesContainer.appendChild(document.createElement('li'))//a space
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
                // new JSEffects().schoolPride();
                // new JSEffects().doRealFireworks();
                // new JSEffects().doRealistic();
                // new JSEffects().doFireworks();
                this.passedThreshold = true;
            }
        }
    }

    private addNewPledge(newPledge: PledgeTS) {
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

    private recentPledgesQueue: PledgeTS[] = [];
    private allPledgesDict: {[key: string]: number} = {};
    private passedThreshold: boolean = false;
    private latestPledgeTime: string = null;
    private allProjects: ProjectTS[]
    private selectedProject: ProjectTS
    private selectedProjectIndex: number = 0;

    private pledgesDiv: HTMLDivElement;
    private recentPledgesDiv: HTMLDivElement;
    private pledgesContainer: HTMLUListElement;
    private totalDiv: HTMLDivElement;
    private shortfallDiv: HTMLDivElement;
    private projectIdDiv: HTMLDivElement;
    private projectDetailsDiv: HTMLDivElement;
    private projectSponsorDiv: HTMLDivElement;
    private projectStatusDiv: HTMLDivElement;
    private projectBackButton: HTMLButtonElement;
    private projectForwardButton: HTMLButtonElement;
}
