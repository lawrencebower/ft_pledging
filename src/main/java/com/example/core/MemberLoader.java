package com.example.core;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class MemberLoader {

    public List<Member> get_all_members() {

        List<Member> results = new ArrayList<>();

        try (Stream<String> lines = Files.lines(Paths.get("./src/main/resources/static/names.txt"))) {

            List<String> linesList = lines.sorted().collect(Collectors.toList());

            for (String name : linesList) {
                results.add(new Member(name));
            }

        } catch (IOException e) {
            e.printStackTrace();
        }

        return results;
    }

}
