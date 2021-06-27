package com.example.core;

import org.apache.commons.lang3.time.DateUtils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

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
            System.out.printf("%s - total pledge now %s%n", pledgeObject.getProjectId(), this.totalPledges.get(projectId));

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

    public PledgesCollection getAllPledges(int desiredProjectId,
                                           String sinceTimeString,
                                           String requestType) {

        System.out.printf("Getting pledges for project %s since %s (%s)\n", desiredProjectId, sinceTimeString, requestType);

        List<Pledge> pledges = new ArrayList<>();
        PledgesCollection results = null;

        if (requestType.equals("refreshAll") || sinceTimeString.equals("all")) {
            pledges = this.allPledges.stream()
                    .filter(pledge -> desiredProjectId == (pledge.getProjectId())).collect(Collectors.toList());
            results = new PledgesCollection(pledges, requestType);
        } else {
            Date sinceDate = this.parseDate(sinceTimeString);
            Date sinceDateTrimmed = DateUtils.truncate(sinceDate, Calendar.MILLISECOND);

            for (Pledge pledge : this.allPledges) {
                Date serverPledgeTime = pledge.getServerPledgeTime();
                Date serverPledgeTimeTrimmed = DateUtils.truncate(serverPledgeTime, Calendar.MILLISECOND);
                if(pledge.getProjectId() == desiredProjectId && serverPledgeTimeTrimmed.compareTo(sinceDateTrimmed) > 0) {
                    pledges.add(pledge);
                }
            }
            results = new PledgesCollection(pledges, requestType);
        }

        System.out.printf("returning - %s\n", results.pledges);

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
