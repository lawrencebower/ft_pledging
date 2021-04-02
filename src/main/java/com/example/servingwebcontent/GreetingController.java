package com.example.servingwebcontent;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;

@Controller
@Scope(value = WebApplicationContext.SCOPE_REQUEST)
public class GreetingController {

    @GetMapping("/greeting1")
    public String greeting(@RequestParam(name = "name", required = false, defaultValue = "no name") String name,
                           Model model) {
        model.addAttribute("name", name);
        return "greeting";
    }

    @GetMapping("/all_pledges_page")
    public String greeting(Model model) {
        return "mr_grabby";
    }
}
