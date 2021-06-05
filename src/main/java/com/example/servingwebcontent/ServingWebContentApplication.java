package com.example.servingwebcontent;

import com.example.core.MemberLoader;
import com.example.core.PledgeCounter;
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
        return new PledgeCounter();
    }

    @Bean
    @Scope(value = WebApplicationContext.SCOPE_APPLICATION)
    public MemberLoader memberLoader() {
        return new MemberLoader();
    }

}
