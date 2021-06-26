package com.example.servingwebcontent;

import com.example.core.MemberLoader;
import com.example.core.PledgeCounter;
import com.example.core.Project;
import com.example.core.ProjectStatus;
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
        counter.addProject(new Project(7624, "Aid for refugees on Leros", "Aegean Solidarity Network Team UK", "Graham", ProjectStatus.CHARITABLE));
        counter.addProject(new Project(7610, "Influencing China's impact on biodiversity", "Environmental Investigation Agency", "Anthony R", ProjectStatus.CHARITABLE));
        counter.addProject(new Project(7609, "Abortion Across Borders", "Abortion Support Network", "Ingrid", ProjectStatus.NON_CHARITY));
        counter.addProject(new Project(7532, "GMIAU", "Greater Manchester Immigration Aid Unit", "Jaqui C", ProjectStatus.CHARITABLE));
        return counter;
    }

    @Bean
    @Scope(value = WebApplicationContext.SCOPE_APPLICATION)
    public MemberLoader memberLoader() {
        return new MemberLoader();
    }

}
