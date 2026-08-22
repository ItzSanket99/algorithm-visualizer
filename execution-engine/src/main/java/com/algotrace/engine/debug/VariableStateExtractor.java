package com.algotrace.engine.debug;

import com.sun.jdi.ArrayReference;
import com.sun.jdi.ObjectReference;
import com.sun.jdi.StackFrame;
import com.sun.jdi.Value;
import com.sun.jdi.LocalVariable;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class VariableStateExtractor {

    public Map<String, String> extract(StackFrame frame) {

        Map<String, String> variables =
                new LinkedHashMap<>();

        try {

            List<LocalVariable> visibleVariables =
                    frame.visibleVariables();

            for (LocalVariable variable : visibleVariables) {

                Value value =
                        frame.getValue(variable);

                variables.put(
                        variable.name(),
                        formatValue(value)
                );
            }

        } catch (Exception ignored) {
            /*
             * Some JVM frames may not expose
             * local variable information.
             */
        }

        return variables;
    }

    private String formatValue(Value value) {

        if (value == null) {
            return "null";
        }

        if (value instanceof ArrayReference array) {

            return "array[length="
                    + array.length()
                    + "]";
        }

        if (value instanceof ObjectReference object) {

            return object.referenceType().name();
        }

        return value.toString();
    }
}