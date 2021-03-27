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
//        this.todos2.add(new TodoItem(name, LocalDateTime.now()));
//
//        this.todos2.forEach(item ->{System.out.println(item.getDescription());});
//        System.out.println(this.todos2);
        return "greeting";
    }

    @GetMapping("/all_pledges_page")
    public String greeting(Model model) {
        return "mr_grabby";
    }
}
