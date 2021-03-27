package com.example.servingwebcontent.restful;

import com.example.core.Pledge;
import com.example.core.PledgeCounter;
import com.example.restservice.Greeting;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin
public class MyRestController2 {

    private static final String template = "Hello, %s!";

    @Autowired
    private PledgeCounter counter;

    @GetMapping("/pledge")
    public Greeting greeting(@RequestParam(value = "name", defaultValue = "no_name") String name,
                             @RequestParam(value = "pledge", defaultValue = "0") int pledge) {
        this.counter.incrementPledge(name, pledge);
        return new Greeting(1, counter.getTotalPledges());
    }

    @GetMapping("/all_pledges_service")
    public List<Pledge> allPledges() {
        return counter.getAllPledges();
    }
}