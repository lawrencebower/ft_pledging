package com.example.core;

import org.apache.commons.lang3.time.DateUtils;
import org.springframework.context.annotation.Bean;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

public class PledgeCounter {

    private int totalPledges = 0;
    private final List<Pledge> allPledges = new ArrayList<>();
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yy:MM:dd:HH:mm:ss:SS");

    public void incrementPledge(String name,
                                int pledge,
                                String remoteTimeString) {
        try {

            this.totalPledges += pledge;

            Date remoteTime = dateFormat.parse(remoteTimeString);
            Pledge pledgeObject = new Pledge(name,
                    pledge,
                    remoteTime,
                    Calendar.getInstance().getTime());

            this.allPledges.add(pledgeObject);
            System.out.printf("%s - total pledge now %s%n", pledgeObject, this.totalPledges);

        } catch (ParseException e) {
            e.printStackTrace();
        }
    }

    public int getTotalPledges() {
        return totalPledges;
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
}
