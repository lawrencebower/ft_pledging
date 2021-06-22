package com.example.core;

public class PledgeSummary {

    private final long id;
    private final int totalPledge;

    public PledgeSummary(long projectId, float totalPledge) {
        this.id = projectId;
        this.totalPledge = totalPledge;
    }

    public long getId() {
        return id;
    }

    public int getTotalPledge() {
        return totalPledge;
    }
}