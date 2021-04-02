package com.example.servingwebcontent.restful;

import com.example.core.Pledge;
import com.example.core.PledgeCounter;
import com.example.core.PledgeSummary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin
public class PledgeRestController {

    private static final String template = "Hello, %s!";

    @Autowired
    private PledgeCounter counter;

    @GetMapping("/pledge")
    public PledgeSummary registerPledge(@RequestParam(value = "name", defaultValue = "no_name") String name,
                                        @RequestParam(value = "pledge", defaultValue = "0") int pledge,
                                        @RequestParam(value = "remoteTime", defaultValue = "0") String rTime) {
        this.counter.incrementPledge(name, pledge, rTime);
        return new PledgeSummary(1, counter.getTotalPledges());
    }

    @GetMapping("/all_pledges_service")
    public List<Pledge> allPledges(@RequestParam(value = "sinceTime", defaultValue = "all") String timeString) {
        List<Pledge> allPledges = counter.getAllPledges(timeString);

        return allPledges;
    }

    @GetMapping("/all_members_service")
    public List<Pledge> allMembers(@RequestParam(value = "sinceTime", defaultValue = "all") String timeString) {
        List<Pledge> allPledges = counter.getAllPledges(timeString);

        return allPledges;
    }
}