package com.example.core;

public class PledgeSummary {

    private final long id;
    private final int content;

    public PledgeSummary(long id, int content) {
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