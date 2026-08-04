package com.algotrace.engine;

import com.algotrace.engine.model.EventType;
import com.algotrace.engine.model.ExecutionEvent;
import com.algotrace.engine.model.ExecutionTrace;

public class Main {

    public static void main(String[] args) {

        ExecutionTrace trace =
                new ExecutionTrace();

        trace.addEvent(

                ExecutionEvent.builder()

                        .eventId(1)

                        .timestamp(System.currentTimeMillis())

                        .eventType(EventType.METHOD_ENTER)

                        .methodName("main")

                        .lineNumber(8)

                        .threadId(1)

                        .build()

        );

        System.out.println(trace.getEvents());

    }

}