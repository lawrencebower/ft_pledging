package com.example.servingwebcontent;

import com.example.core.MemberLoader;
import com.example.core.PledgeCounter;
import com.example.core.Project;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.web.context.WebApplicationContext;

@SpringBootApplication
public class ServingWebContentApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServingWebContentApplication.class, args);

    }

    @Bean
    @Scope(value = WebApplicationContext.SCOPE_APPLICATION)
    public PledgeCounter counter() {
        PledgeCounter counter = new PledgeCounter();
        counter.addProject(new Project(1, "project 1"));
        counter.addProject(new Project(2, "project 2"));
        counter.addProject(new Project(3, "project 3"));
        counter.addProject(new Project(4, "project 4"));
        return counter;
    }

    @Bean
    @Scope(value = WebApplicationContext.SCOPE_APPLICATION)
    public MemberLoader memberLoader() {
        return new MemberLoader();
    }

}
