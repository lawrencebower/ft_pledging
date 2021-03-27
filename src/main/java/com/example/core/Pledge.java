package com.example.core;

public class Pledge {

    private String name;
    private int pledge;

    public Pledge(String name, int pledge) {
        this.name = name;
        this.pledge = pledge;
    }

    public String getName() {
        return name;
    }

    public int getPledge() {
        return pledge;
    }
}
