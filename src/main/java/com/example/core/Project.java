package com.example.core;

public class Project {

    private final int id;
    private final String name;
    private final String organisation;
    private final String sponsor;
    private final ProjectStatus status;

    public Project(int id,
                   String name,
                   String organisation,
                   String sponsor,
                   ProjectStatus status) {
        this.id = id;
        this.name = name;
        this.organisation = organisation;
        this.sponsor = sponsor;
        this.status = status;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getOrganisation() {
        return organisation;
    }

    public String getSponsor() {
        return sponsor;
    }

    public ProjectStatus getStatus() {
        return status;
    }
}
