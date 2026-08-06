package com.algotrace.engine.debug;

import com.sun.jdi.LocalVariable;
import com.sun.jdi.StackFrame;
import com.sun.jdi.Value;
import com.sun.jdi.event.MethodEntryEvent;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class VariableExtractor {

    /**
     * Extracts all visible local variables from
     * the current stack frame.
     */
    public Map<String, String> extract(MethodEntryEvent event) {

        Map<String, String> variables =
                new LinkedHashMap<>();

        try {

            StackFrame frame =
                    event.thread().frame(0);

            List<LocalVariable> localVariables =
                    frame.visibleVariables();

            for (LocalVariable variable : localVariables) {

                Value value =
                        frame.getValue(variable);

                variables.put(

                        variable.name(),

                        value == null
                                ? "null"
                                : value.toString()

                );

            }

        }

        catch (Exception ignored) {

            /*
             * Native methods and synthetic frames
             * may not expose variables.
             */

        }

        return variables;

    }

}