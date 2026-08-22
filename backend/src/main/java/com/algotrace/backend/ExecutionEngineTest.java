package com.algotrace.backend;

import com.algotrace.engine.ExecutionEngine;
import com.algotrace.engine.model.ExecutionTrace;

public class ExecutionEngineTest {

    public static void main(String[] args) throws Exception {

        String sourceCode = """
                public class Test {

                    public static void main(String[] args) {

                        int result = factorial(3);

                        System.out.println(result);
                    }

                    static int factorial(int n) {

                        if (n == 0) {
                            return 1;
                        }

                        int result =
                                n * factorial(n - 1);

                        return result;
                    }
                }
                """;

        ExecutionEngine engine =
                new ExecutionEngine();

        ExecutionTrace trace =
                engine.execute(sourceCode);

        System.out.println(
                "Events captured: "
                        + trace.getEvents().size()
        );
    }
}