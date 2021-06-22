package com.example.core;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

public class Pledge implements Comparable<Pledge>{

    private final String name;
    private final int pledge;
    private final int projectId;
    private final Date clientPledgeTime;
    private final Date serverPledgeTime;
    private final String serverTimeString;
    private final String clientTimeString;

    public Pledge(String name,
                  int pledge,
                  int projectId,
                  Date clientTime,
                  Date serverTime) {

        this.name = name;
        this.pledge = pledge;
        this.projectId = projectId;
        this.clientPledgeTime = clientTime;
        this.serverPledgeTime = serverTime;

        DateFormat dtf = new SimpleDateFormat("yy:MM:dd:HH:mm:ss:SS");
        this.serverTimeString = dtf.format(serverTime);
        this.clientTimeString = dtf.format(clientTime);
    }

    public String getName() {
        return this.name;
    }

    public int getPledge() {
        return this.pledge;
    }

    public int getProjectId() {
        return this.projectId;
    }

    public Date getServerPledgeTime() {
        return this.serverPledgeTime;
    }

    public String getServerTimeString() {
        return this.serverTimeString;
    }

    public Date getClientPledgeTime() {
        return this.clientPledgeTime;
    }

    public String getClientTimeString() {
        return this.clientTimeString;
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
