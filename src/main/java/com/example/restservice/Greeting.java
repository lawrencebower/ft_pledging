package com.example.restservice;

public class Greeting {

    private final long id;
    private final int content;

    public Greeting(long id, int content) {
        this.id = id;
        this.content = content;
    }

    public long getId() {
        return id;
    }

    public int getContent() {
        return content;
    }
}