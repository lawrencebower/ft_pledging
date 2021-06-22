package com.example.core;

import org.apache.commons.lang3.time.DateUtils;
import org.springframework.context.annotation.Bean;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

public class PledgeCounter {

    private final Map<Integer, Float> totalPledges = new HashMap<>();
    private final List<Pledge> allPledges = new ArrayList<>();
    private final List<Project> allProjects = new ArrayList<>();
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yy:MM:dd:HH:mm:ss:SS");

    public void incrementPledge(String name,
                                int pledge,
                                int projectId,
                                String remoteTimeString) {
        try {

            Float currentPledge = this.totalPledges.get(projectId);
            this.totalPledges.put(projectId, (currentPledge + pledge));

            Date remoteTime = dateFormat.parse(remoteTimeString);
            Pledge pledgeObject = new Pledge(name,
                    pledge,
                    projectId,
                    remoteTime,
                    Calendar.getInstance().getTime());

            this.allPledges.add(pledgeObject);
            System.out.printf("%s - total pledge now %s%n", pledgeObject, this.totalPledges);

        } catch (ParseException e) {
            e.printStackTrace();
        }
    }

    public int getTotalPledges() {
        return -1;
    }

    public float getTotalPledgeForProject(int projectId) {
        return this.totalPledges.get(projectId);
    }

    public List<Pledge> getAllPledges(String sinceTimeString) {

        System.out.printf("Getting pledges since %s%n", sinceTimeString);

        List<Pledge> results = new ArrayList<>();

        if (sinceTimeString.equals("all")) {
            results = this.allPledges;
        } else {
            Date sinceDate = this.parseDate(sinceTimeString);
            Date sinceDateTrimmed = DateUtils.truncate(sinceDate, Calendar.MILLISECOND);

            for (Pledge pledge : this.allPledges) {
                Date serverPledgeTime = pledge.getServerPledgeTime();
                Date serverPledgeTimeTrimmed = DateUtils.truncate(serverPledgeTime, Calendar.MILLISECOND);
                if(serverPledgeTimeTrimmed.compareTo(sinceDateTrimmed) > 0) {
                    results.add(pledge);
                }
            }
        }

        System.out.printf("returning - %s\n", results);

        return results;
    }

    private Date parseDate(String dateString) {
        try {
            return dateFormat.parse(dateString);
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
    }

    public void addProject(Project project) {
        this.allProjects.add(project);
        this.totalPledges.put(project.getId(), 0f);
    }

    public List<Project> getAllProjects() {
        return allProjects;
    }
}
