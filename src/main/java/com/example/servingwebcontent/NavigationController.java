package com.example.servingwebcontent;

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.context.WebApplicationContext;

@Controller
@Scope(value = WebApplicationContext.SCOPE_REQUEST)
public class NavigationController {

    @GetMapping("/phone_client")
    public String navToPhoneCLient(@RequestParam(name = "name", required = false, defaultValue = "no name") String name,
                                   Model model) {

        model.addAttribute("name", name);
        return "phone_client";
    }

    @GetMapping("/group_pledge_summary")
    public String navToGroupPledgeSummary(Model model) {
        return "group_pledge_summary";
    }

    @GetMapping("/group_client")
    public String navToGroupClient(Model model) {
        return "group_client";
    }
}
