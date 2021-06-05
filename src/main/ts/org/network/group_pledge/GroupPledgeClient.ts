import axios, {AxiosResponse} from 'axios';
import {debounce} from "ts-debounce";
import moment = require("moment");
import {getPrettyDateString} from "../Utils";
import {Constants} from "../common/Constants";

class GroupPledger {

    caller = (user, pledge, pledgeTime) => this.makePledge(user, pledge, pledgeTime)
    bouncy = debounce(this.caller, 750, {isImmediate: false});

    public setup() {
        document.addEventListener("keydown", (e) => this.handleKeyPress(e))
        this.totalDiv = document.getElementById("total_div") as HTMLDivElement;
        this.membersContainer = document.getElementById("member_container") as HTMLUListElement;
        this.callPopulateMembers()
    }

    public callPopulateMembers() {
        let callString = `http://${Constants.SERVER_IP}:${Constants.SERVER_PORT}/all_members_service`
        axios.get(callString)
            .then(response => this.populateMembers(response))
            .catch(error => this.error(error))
            .then(() => this.default());
    }

    public populateMembers(response: AxiosResponse) {

        console.log(response.data)

        for (let responseDict of response.data) {

            let memberName: string = responseDict["name"]

            let listElement = document.getElementById(memberName) as HTMLLIElement

            if (listElement == undefined) {
                listElement = document.createElement('li') as HTMLLIElement
                listElement.setAttribute("class", "li_wrap disable-dbl-tap-zoom")
                listElement.setAttribute("id", memberName)

                let liTableDivElement = document.createElement('div') as HTMLDivElement
                liTableDivElement.setAttribute("class", "li_tablediv")

                let liRowDivElement = document.createElement('div') as HTMLDivElement
                liRowDivElement.setAttribute("class", "li_rowdiv")

                let nameDivElement = document.createElement('div') as HTMLDivElement
                nameDivElement.setAttribute("class", "li_namediv")

                nameDivElement.innerText = memberName
                nameDivElement.addEventListener("click", (event) => {
                    nameDivElement.style.backgroundColor = "red";
                    this.currentMemberElement = nameDivElement;
                    this.preparePledge(memberName, 100);
                })

                let moreDivElement = document.createElement('div') as HTMLDivElement
                moreDivElement.setAttribute("class", "li_morediv")

                moreDivElement.innerText = "+"
                moreDivElement.addEventListener("click", (event) => {
                    console.log("hi")
                })

                liRowDivElement.appendChild(nameDivElement)
                liRowDivElement.appendChild(moreDivElement)
                liTableDivElement.appendChild(liRowDivElement)
                listElement.appendChild(liTableDivElement)

                this.membersContainer.appendChild(listElement)
                this.allMembersDict[memberName] = listElement;
            }
        }
    }

    public handleKeyPress(evt : KeyboardEvent) {

        console.log(evt);

        let letter: string = evt.key

        this.removeAllChildNodes(this.membersContainer)

        for (let memberName in this.allMembersDict) {
            if (memberName.toLocaleLowerCase().startsWith(letter)) {
                let element: HTMLLIElement = this.allMembersDict[memberName]
                element.style.backgroundColor = "white"
                this.membersContainer.appendChild(element)
            }
        }

    }

    public removeAllChildNodes(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    public error(error) {
        console.log(error)
    }

    public default() {
        console.log("default")
    }

    private allMembersDict: {[key: string]: HTMLLIElement} = {};
    private membersContainer: HTMLUListElement;

    public preparePledge(memberName: string, pledge: number) {
        this.newPledge += pledge;
        console.log(this.newPledge)
        this.totalDiv.innerText = `${memberName}: +${String(this.newPledge)}`;
        let dateTime = new Date()
        let dateString = moment(dateTime).format('yy:MM:DD:HH:mm:ss:SS');

        this.bouncy(memberName, this.newPledge, dateString)
    }

    private makePledge(memberName: string, pledge: number, pledgeTime: string) {
        let callString = `http://${Constants.SERVER_IP}:${Constants.SERVER_PORT}/pledge?pledge=${pledge}&name=${memberName}&remoteTime=${pledgeTime}`
        axios.get(callString)
            .then(response => this.dealWithPledge(response))
            .catch(error => this.error(error))
            .then(() => this.default());
    }

    public dealWithPledge(response: AxiosResponse) {
        console.log(response.data)
        this.totalDiv.innerText = `${this.currentMemberElement.innerText} ${this.newPledge} - saved`
        this.currentMemberElement.style.backgroundColor = "white";
        this.newPledge = 0;
    }

    private newPledge: number = 0
    private totalDiv: HTMLDivElement;
    private currentMemberElement: HTMLDivElement

}

window.onload = function (e) {
    new GroupPledger().setup()
};
