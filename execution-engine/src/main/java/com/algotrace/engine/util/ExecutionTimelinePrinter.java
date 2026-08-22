package com.algotrace.engine.util;

import com.algotrace.engine.model.EventType;
import com.algotrace.engine.model.ExecutionEvent;
import com.algotrace.engine.model.ExecutionTrace;

import java.util.Map;

public class ExecutionTimelinePrinter {

    public static void print(ExecutionTrace trace) {

        System.out.println();
        System.out.println("========== EXECUTION TIMELINE ==========");

        String currentMethod = null;

        for (ExecutionEvent event : trace.getEvents()) {

            if (event.getEventType() != EventType.LINE_EXECUTED) {
                continue;
            }

            if (!event.getMethodName().equals(currentMethod)) {

                currentMethod = event.getMethodName();

                System.out.println();
                System.out.println(
                        "Method: " + currentMethod
                );
            }

            System.out.println(
                    "  Line " + event.getLineNumber()
            );

            Map<String, String> variables =
                    event.getVariables();

            if (variables == null || variables.isEmpty()) {

                System.out.println(
                        "    Variables: {}"
                );

                continue;
            }

            for (Map.Entry<String, String> entry :
                    variables.entrySet()) {

                System.out.println(
                        "    "
                                + entry.getKey()
                                + " = "
                                + formatValue(entry.getValue())
                );
            }
        }
    }

    private static String formatValue(String value) {

        if (value == null) {
            return "null";
        }

        if (value.startsWith(
                "instance of java.lang.String"
        )) {
            return value;
        }

        return value;
    }
}