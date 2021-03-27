import axios, {AxiosResponse} from 'axios';
import * as React from "react";
import {debounce} from "ts-debounce";
import { parse, format, addMonth } from "ts-date";

interface IPost {
    userId: number;
    id?: number;
    title: string;
    body: string;
}

class Caller {

    caller = (user, pledge) => this.makePledge(user, pledge)
    bouncy = debounce(this.caller, 250, {isImmediate: false});

    public setup() {

        this.giveButton = document.getElementById("giveButton") as HTMLButtonElement;
        this.takeButton = document.getElementById("takeButton") as HTMLButtonElement;

        this.pledgeDiv = document.getElementById("pledgeDiv") as HTMLDivElement;
        this.messageDiv = document.getElementById("messageDiv") as HTMLDivElement;
        let nameInput: HTMLInputElement = document.getElementById("hidden_name_field") as HTMLInputElement;
        this.user = nameInput.value

        this.giveButton.addEventListener("click", (event) => {
            this.pledge(100);
        });

        this.takeButton.addEventListener("click", (event) => {
            this.pledge(-100);
        });
    }

    public pledge(pledge: number) {
        this.newPledge += pledge;
        console.log(this.newPledge)
        this.tempTotalPledge = this.totalPledge + this.newPledge;
        this.pledgeDiv.innerText = String(this.tempTotalPledge);
        this.bouncy(this.user, this.newPledge)
    }

    public makePledge(user: String, pledge: number) {
        let callString = `http://192.168.0.21:8080/pledge?pledge=${pledge}&name=${user}`
        axios.get(callString)
            .then(response => this.dealWith(response))
            .catch(error => this.error(error))
            .then(() => this.default());
    }

    public dealWith(response: AxiosResponse) {

        console.log(response.data)

        this.totalPledge = this.tempTotalPledge;
        this.tempTotalPledge = 0;
        this.newPledge = 0;

        this.messageDiv.innerText = `Pledge saved (${this.getDateString()})`
        this.pledgeDiv.innerText = String(this.totalPledge);
    }

    public error(error) {
        console.log(error)
        this.messageDiv.innerText = `error! (${this.getDateString()})`
    }

    public default() {
        console.log("default")
    }

    public getDateString() : String {
        let date = new Date();
        return format(date, "HH:mm:ss");
    }

    private giveButton: HTMLButtonElement;
    private takeButton: HTMLButtonElement;
    private pledgeDiv: HTMLDivElement;
    private messageDiv: HTMLDivElement;
    private user: String = "not_set"

    private totalPledge: number = 0
    private newPledge: number = 0
    private tempTotalPledge: number = 0

}

// new Caller().run()
window.onload = function (e) {
    new Caller().setup()
};
