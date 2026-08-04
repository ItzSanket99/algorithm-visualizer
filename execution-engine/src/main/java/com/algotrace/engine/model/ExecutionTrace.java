package com.algotrace.engine.model;

import lombok.Getter;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Getter
public class ExecutionTrace {

    private final List<ExecutionEvent> events =
            new ArrayList<>();

    public void addEvent(ExecutionEvent event) {

        events.add(event);

    }

    public List<ExecutionEvent> getEvents() {

        return Collections.unmodifiableList(events);

    }

}