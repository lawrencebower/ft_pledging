package com.example.core;

import org.springframework.context.annotation.Bean;

import java.util.ArrayList;
import java.util.List;

public class PledgeCounter {

    private int totalPledges = 0;
    private final List<Pledge> allPledges = new ArrayList<>();

    public void incrementPledge(String name, int pledge) {
        this.totalPledges += pledge;
        this.allPledges.add(new Pledge(name, pledge));
        System.out.printf("total pledge now %s%n", this.totalPledges);
    }

    public int getTotalPledges() {
        return totalPledges;
    }

    public List<Pledge> getAllPledges() {
        return this.allPledges;
    }
}
