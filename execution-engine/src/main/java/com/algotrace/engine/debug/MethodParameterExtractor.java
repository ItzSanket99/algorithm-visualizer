package com.algotrace.engine.debug;

import com.sun.jdi.LocalVariable;
import com.sun.jdi.StackFrame;
import com.sun.jdi.Value;
import com.sun.jdi.event.MethodEntryEvent;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class MethodParameterExtractor {

    public Map<String, String> extract(MethodEntryEvent event) {

        Map<String, String> parameters = new LinkedHashMap<>();

        try {

            StackFrame frame = event.thread().frame(0);

            List<LocalVariable> variables = frame.visibleVariables();


            for (LocalVariable variable : variables) {


                if (!variable.isArgument()) {
                    continue;
                }

                Value value = frame.getValue(variable);

                parameters.put(
                        variable.name(),
                        value == null ? "null" : value.toString()
                );
            }

        } catch (Exception e) {

            e.printStackTrace();

        }

        return parameters;
    }

}