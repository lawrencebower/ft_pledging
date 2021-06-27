package com.example.servingwebcontent.restful;

import com.example.core.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin
public class PledgeRestController {

    @Autowired
    private PledgeCounter counter;
    @Autowired
    private MemberLoader memberLoader;

    @GetMapping("/pledge")
    public PledgeSummary registerPledge(@RequestParam(value = "name", defaultValue = "no_name") String name,
                                        @RequestParam(value = "projectId", defaultValue = "1") int projectId,
                                        @RequestParam(value = "pledge", defaultValue = "0") int pledge,
                                        @RequestParam(value = "remoteTime", defaultValue = "0") String rTime) {
        System.out.printf("Pledge %s %s %s%n", name, projectId, pledge);
        this.counter.incrementPledge(name, pledge, projectId, rTime);
        return new PledgeSummary(projectId, counter.getTotalPledgeForProject(projectId));
    }

    @GetMapping("/all_projects")
    public List<Project> allProjects() {
        List<Project> allProjects = counter.getAllProjects();

        return allProjects;
    }

    @GetMapping("/all_pledges")
    public PledgesCollection allPledges(@RequestParam(value = "projectId", defaultValue = "-1") int projectId,
                                        @RequestParam(value = "requestType", defaultValue = "refreshAll") String requestType,
                                        @RequestParam(value = "sinceTime", defaultValue = "all") String timeString) {
        PledgesCollection allPledges = counter.getAllPledges(projectId, timeString, requestType);

        return allPledges;
    }

    @GetMapping("/all_members")
    public List<Member> allMembers() {
        return memberLoader.get_all_members();
    }
}