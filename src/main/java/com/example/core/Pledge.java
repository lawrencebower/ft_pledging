package com.example.core;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

public class Pledge implements Comparable<Pledge>{

    private final String name;
    private final int pledge;
    private final Date clientPledgeTime;
    private final Date serverPledgeTime;
    private final String serverTimeString;
    private final String clientTimeString;

    public Pledge(String name,
                  int pledge,
                  Date clientTime,
                  Date serverTime) {

        this.name = name;
        this.pledge = pledge;
        this.clientPledgeTime = clientTime;
        this.serverPledgeTime = serverTime;

        DateFormat dtf = new SimpleDateFormat("yy:MM:dd:HH:mm:ss:SS");
        this.serverTimeString = dtf.format(serverTime);
        this.clientTimeString = dtf.format(clientTime);
    }

    public String getName() {
        return name;
    }

    public int getPledge() {
        return pledge;
    }

    public Date getServerPledgeTime() {
        return serverPledgeTime;
    }

    public String getServerTimeString() {
        return serverTimeString;
    }

    public Date getClientPledgeTime() {
        return clientPledgeTime;
    }

    public String getClientTimeString() {
        return clientTimeString;
    }

    @Override
    public String toString() {
        return String.format("%s:%s (%s)", this.name, this.pledge, this.serverTimeString);
    }

    @Override
    public int compareTo(Pledge o) {
        return o.serverPledgeTime.compareTo(this.serverPledgeTime);
    }
}
