package com.algotrace.engine.debug;

import com.sun.jdi.ArrayReference;
import com.sun.jdi.Field;
import com.sun.jdi.IntegerValue;
import com.sun.jdi.ObjectReference;
import com.sun.jdi.ReferenceType;
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

                String formattedValue =
                        formatValue(value);

                System.out.println(
                        "[VARIABLE] " +
                                variable.name() +
                                " = " +
                                formattedValue
                );

                variables.put(
                        variable.name(),
                        formattedValue
                );
            }

        } catch (Exception ignored) {
        }

        return variables;
    }

    private String formatValue(Value value) {

        if (value == null) {
            return "null";
        }

        /*
         * =====================================================
         * ARRAY
         * =====================================================
         */

        if (value instanceof ArrayReference array) {
            return formatArray(array);
        }

        /*
         * =====================================================
         * OBJECT
         * =====================================================
         */

        if (value instanceof ObjectReference object) {

            /*
             * Existing Stack support
             */
            if (isJavaStack(object)) {
                return formatStack(object);
            }

            /*
             * New Queue support
             */
            if (isJavaQueue(object)) {
                return formatQueue(object);
            }

            /*
             * Existing object behaviour
             */
            return formatObject(object);
        }

        /*
         * Primitive values
         */
        return value.toString();
    }

    /*
     * =========================================================
     * JAVA UTIL STACK
     * =========================================================
     *
     * java.util.Stack extends java.util.Vector.
     *
     * Vector stores its elements in:
     *
     *     elementData
     *
     * and the current number of elements in:
     *
     *     elementCount
     *
     * We inspect these fields directly through JDI.
     *
     * This avoids invoking Stack methods while the debuggee
     * is suspended and therefore does not create extra
     * execution events.
     */

    private boolean isJavaStack(
            ObjectReference object
    ) {

        try {

            ReferenceType type =
                    object.referenceType();

            while (type != null) {

                if (
                        "java.util.Stack".equals(
                                type.name()
                        )
                ) {
                    return true;
                }

                if (
                        type instanceof com.sun.jdi.ClassType
                                classType
                ) {

                    type =
                            classType.superclass();

                } else {

                    break;
                }
            }

        } catch (Exception ignored) {
        }

        return false;
    }

    private String formatStack(
            ObjectReference stack
    ) {

        try {

            Field elementDataField =
                    findField(
                            stack.referenceType(),
                            "elementData"
                    );

            Field elementCountField =
                    findField(
                            stack.referenceType(),
                            "elementCount"
                    );

            if (
                    elementDataField == null ||
                            elementCountField == null
            ) {
                return "STACK:[]";
            }

            Value dataValue =
                    stack.getValue(
                            elementDataField
                    );

            Value countValue =
                    stack.getValue(
                            elementCountField
                    );

            if (
                    !(dataValue instanceof ArrayReference array) ||
                            !(countValue instanceof IntegerValue count)
            ) {
                return "STACK:[]";
            }

            int size =
                    Math.max(
                            0,
                            count.value()
                    );

            List<Value> values =
                    array.getValues(
                            0,
                            Math.min(
                                    size,
                                    array.length()
                            )
                    );

            StringBuilder result =
                    new StringBuilder(
                            "STACK:["
                    );

            for (
                    int i = 0;
                    i < values.size();
                    i++
            ) {

                if (i > 0) {
                    result.append(", ");
                }

                result.append(
                        formatStackElement(
                                values.get(i)
                        )
                );
            }

            result.append("]");

            return result.toString();

        } catch (Exception ignored) {

            return "STACK:[]";
        }
    }

    private String formatStackElement(
            Value value
    ) {

        if (value == null) {
            return "null";
        }

        if (value instanceof ArrayReference array) {
            return formatArray(array);
        }

        if (value instanceof ObjectReference object) {

            String typeName =
                    object.referenceType().name();

            /*
             * Unwrap common boxed primitive values so:
             *
             * Stack<Integer>
             *
             * becomes:
             *
             * STACK:[10, 20, 30]
             */

            try {

                if (
                        "java.lang.Integer".equals(typeName) ||
                                "java.lang.Long".equals(typeName) ||
                                "java.lang.Short".equals(typeName) ||
                                "java.lang.Byte".equals(typeName) ||
                                "java.lang.Double".equals(typeName) ||
                                "java.lang.Float".equals(typeName) ||
                                "java.lang.Boolean".equals(typeName) ||
                                "java.lang.Character".equals(typeName)
                ) {

                    Field valueField =
                            findField(
                                    object.referenceType(),
                                    "value"
                            );

                    if (valueField != null) {

                        Value primitiveValue =
                                object.getValue(
                                        valueField
                                );

                        if (
                                primitiveValue != null
                        ) {
                            return primitiveValue.toString();
                        }
                    }
                }

            } catch (Exception ignored) {
            }

            return typeName;
        }

        return value.toString();
    }

    /*
     * =========================================================
     * QUEUE
     * =========================================================
     *
     * Currently supports:
     *
     *     Queue<Integer> queue = new LinkedList<>();
     *
     * and:
     *
     *     Queue<Integer> queue = new ArrayDeque<>();
     *
     * We inspect the internal fields directly through JDI.
     *
     * No queue methods are invoked.
     */

    private boolean isJavaQueue(
            ObjectReference object
    ) {

        try {

            ReferenceType type =
                    object.referenceType();

            while (type != null) {

                String typeName =
                        type.name();

                /*
                 * LinkedList implements Queue.
                 */
                if (
                        "java.util.LinkedList".equals(
                                typeName
                        )
                ) {
                    return true;
                }

                /*
                 * ArrayDeque implements Queue.
                 */
                if (
                        "java.util.ArrayDeque".equals(
                                typeName
                        )
                ) {
                    return true;
                }

                if (
                        type instanceof com.sun.jdi.ClassType
                                classType
                ) {

                    type =
                            classType.superclass();

                } else {

                    break;
                }
            }

        } catch (Exception ignored) {
        }

        return false;
    }

    private String formatQueue(
            ObjectReference queue
    ) {

        try {

            String typeName =
                    queue.referenceType().name();

            /*
             * LinkedList Queue
             */
            if (
                    "java.util.LinkedList".equals(
                            typeName
                    )
            ) {

                return formatLinkedListQueue(
                        queue
                );
            }

            /*
             * ArrayDeque Queue
             */
            if (
                    "java.util.ArrayDeque".equals(
                            typeName
                    )
            ) {

                return formatArrayDeque(
                        queue
                );
            }

        } catch (Exception ignored) {
        }

        return "QUEUE:[]";
    }

    /*
     * =========================================================
     * LINKEDLIST QUEUE
     * =========================================================
     *
     * LinkedList internally maintains:
     *
     *     first
     *     last
     *     size
     *
     * Each node contains:
     *
     *     item
     *     next
     *     prev
     *
     * We start from first and follow next.
     */

    private String formatLinkedListQueue(
            ObjectReference queue
    ) {

        try {

            Field firstField =
                    findField(
                            queue.referenceType(),
                            "first"
                    );

            Field sizeField =
                    findField(
                            queue.referenceType(),
                            "size"
                    );

            if (
                    firstField == null ||
                            sizeField == null
            ) {
                return "QUEUE:[]";
            }

            Value firstValue =
                    queue.getValue(
                            firstField
                    );

            Value sizeValue =
                    queue.getValue(
                            sizeField
                    );

            if (
                    !(sizeValue instanceof IntegerValue size)
            ) {
                return "QUEUE:[]";
            }

            int count =
                    Math.max(
                            0,
                            size.value()
                    );

            StringBuilder result =
                    new StringBuilder(
                            "QUEUE:["
                    );

            Value current =
                    firstValue;

            int actualCount = 0;

            while (
                    current instanceof ObjectReference node &&
                            actualCount < count
            ) {

                Field itemField =
                        findField(
                                node.referenceType(),
                                "item"
                        );

                Field nextField =
                        findField(
                                node.referenceType(),
                                "next"
                        );

                if (itemField == null) {
                    break;
                }

                Value item =
                        node.getValue(
                                itemField
                        );

                if (actualCount > 0) {
                    result.append(", ");
                }

                result.append(
                        formatQueueElement(
                                item
                        )
                );

                actualCount++;

                if (nextField == null) {
                    break;
                }

                current =
                        node.getValue(
                                nextField
                        );
            }

            result.append("]");

            return result.toString();

        } catch (Exception ignored) {

            return "QUEUE:[]";
        }
    }

    /*
     * =========================================================
     * ARRAY DEQUE QUEUE
     * =========================================================
     *
     * ArrayDeque internally uses:
     *
     *     elements
     *     head
     *     tail
     *
     * The queue is stored in a circular array.
     */

    private String formatArrayDeque(
            ObjectReference queue
    ) {

        try {

            Field elementsField =
                    findField(
                            queue.referenceType(),
                            "elements"
                    );

            Field headField =
                    findField(
                            queue.referenceType(),
                            "head"
                    );

            Field tailField =
                    findField(
                            queue.referenceType(),
                            "tail"
                    );

            if (
                    elementsField == null ||
                            headField == null ||
                            tailField == null
            ) {
                return "QUEUE:[]";
            }

            Value elementsValue =
                    queue.getValue(
                            elementsField
                    );

            Value headValue =
                    queue.getValue(
                            headField
                    );

            Value tailValue =
                    queue.getValue(
                            tailField
                    );

            if (
                    !(elementsValue instanceof ArrayReference elements) ||
                            !(headValue instanceof IntegerValue head) ||
                            !(tailValue instanceof IntegerValue tail)
            ) {
                return "QUEUE:[]";
            }

            int h =
                    head.value();

            int t =
                    tail.value();

            StringBuilder result =
                    new StringBuilder(
                            "QUEUE:["
                    );

            int index = h;

            boolean firstElement = true;

            int safetyCounter = 0;

            /*
             * ArrayDeque uses a circular array.
             *
             * Safety counter prevents an accidental
             * infinite loop if the internal representation
             * is unexpected.
             */

            while (
                    index != t &&
                            safetyCounter < elements.length()
            ) {

                Value value =
                        elements.getValue(index);

                /*
                 * ArrayDeque does not store null values,
                 * but keep this check for safety.
                 */
                if (value != null) {

                    if (!firstElement) {
                        result.append(", ");
                    }

                    result.append(
                            formatQueueElement(
                                    value
                            )
                    );

                    firstElement = false;
                }

                index++;

                if (
                        index >= elements.length()
                ) {
                    index = 0;
                }

                safetyCounter++;
            }

            result.append("]");

            return result.toString();

        } catch (Exception ignored) {

            return "QUEUE:[]";
        }
    }

    /*
     * =========================================================
     * QUEUE ELEMENT
     * =========================================================
     */

    private String formatQueueElement(
            Value value
    ) {

        if (value == null) {
            return "null";
        }

        if (value instanceof ArrayReference array) {
            return formatArray(array);
        }

        if (value instanceof ObjectReference object) {

            String typeName =
                    object.referenceType().name();

            /*
             * Unwrap boxed primitive values.
             */

            try {

                if (
                        "java.lang.Integer".equals(typeName) ||
                                "java.lang.Long".equals(typeName) ||
                                "java.lang.Short".equals(typeName) ||
                                "java.lang.Byte".equals(typeName) ||
                                "java.lang.Double".equals(typeName) ||
                                "java.lang.Float".equals(typeName) ||
                                "java.lang.Boolean".equals(typeName) ||
                                "java.lang.Character".equals(typeName)
                ) {

                    Field valueField =
                            findField(
                                    object.referenceType(),
                                    "value"
                            );

                    if (valueField != null) {

                        Value primitiveValue =
                                object.getValue(
                                        valueField
                                );

                        if (
                                primitiveValue != null
                        ) {
                            return primitiveValue.toString();
                        }
                    }
                }

                /*
                 * Handle String values.
                 */
                if (
                        "java.lang.String".equals(
                                typeName
                        )
                ) {

                    Field valueField =
                            findField(
                                    object.referenceType(),
                                    "value"
                            );

                    if (valueField != null) {

                        Value stringValue =
                                object.getValue(
                                        valueField
                                );

                        if (
                                stringValue instanceof ArrayReference
                                        stringArray
                        ) {

                            List<Value> chars =
                                    stringArray.getValues();

                            StringBuilder text =
                                    new StringBuilder();

                            for (Value character : chars) {

                                if (
                                        character instanceof IntegerValue
                                                integerValue
                                ) {

                                    text.append(
                                            (char)
                                                    integerValue.value()
                                    );
                                }
                            }

                            return "\"" +
                                    text +
                                    "\"";
                        }
                    }
                }

            } catch (Exception ignored) {
            }

            return typeName;
        }

        return value.toString();
    }

    /*
     * =========================================================
     * FIELD FINDER
     * =========================================================
     *
     * Searches all fields including inherited fields.
     *
     * This is important for Stack because Stack extends
     * Vector and elementData / elementCount are inherited.
     */

    private Field findField(
            ReferenceType type,
            String fieldName
    ) {

        try {

            for (
                    Field field :
                    type.allFields()
            ) {

                if (
                        fieldName.equals(
                                field.name()
                        )
                ) {

                    return field;
                }
            }

        } catch (Exception ignored) {
        }

        return null;
    }

    /*
     * =========================================================
     * ARRAY SUPPORT
     * =========================================================
     */

    private String formatArray(
            ArrayReference array
    ) {

        try {

            List<Value> values =
                    array.getValues();

            StringBuilder result =
                    new StringBuilder();

            result.append("[");

            for (
                    int i = 0;
                    i < values.size();
                    i++
            ) {

                if (i > 0) {
                    result.append(", ");
                }

                result.append(
                        formatArrayElement(
                                values.get(i)
                        )
                );
            }

            result.append("]");

            return result.toString();

        } catch (Exception ignored) {

            return "[]";
        }
    }

    private String formatArrayElement(
            Value value
    ) {

        if (value == null) {
            return "null";
        }

        if (value instanceof ArrayReference nestedArray) {
            return formatArray(nestedArray);
        }

        if (value instanceof ObjectReference object) {
            return formatObject(object);
        }

        return value.toString();
    }

    /*
     * =========================================================
     * GENERIC OBJECT SUPPORT
     * =========================================================
     */

    private String formatObject(
            ObjectReference object
    ) {

        return object.referenceType().name();
    }
}