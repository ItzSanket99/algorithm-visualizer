package com.algotrace.engine;

import com.algotrace.engine.compiler.CompilationResult;
import com.algotrace.engine.compiler.JavaSourceCompiler;
import com.algotrace.engine.debug.DebugLauncher;
import com.algotrace.engine.debug.DebugSession;
import com.algotrace.engine.debug.MethodEventCollector;
import com.algotrace.engine.model.CallTree;
import com.algotrace.engine.model.ExecutionTrace;
import com.algotrace.engine.tracer.CallTreeBuilder;
import com.algotrace.engine.util.ExecutionTimelinePrinter;
import com.algotrace.engine.util.TreePrinter;

public class Main {

    public static void main(String[] args) {

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

        try {

            // ==========================================
            // 1. COMPILE
            // ==========================================

            JavaSourceCompiler compiler =
                    new JavaSourceCompiler();

            CompilationResult compilationResult =
                    compiler.compile(sourceCode);

            if (!compilationResult.isSuccess()) {

                System.out.println(
                        "Compilation failed:"
                );

                compilationResult
                        .getDiagnostics()
                        .forEach(System.out::println);

                return;
            }

            // ==========================================
            // 2. START DEBUG SESSION
            // ==========================================

            DebugLauncher launcher =
                    new DebugLauncher();

            DebugSession session =
                    launcher.launch(
                            compilationResult.getClassName()
                    );

            // ==========================================
            // 3. COLLECT EXECUTION
            // ==========================================

            MethodEventCollector collector =
                    new MethodEventCollector(session);

            collector.start();

            ExecutionTrace trace =
                    collector.getExecutionTrace();

            // ==========================================
            // 4. CALL TREE
            // ==========================================

            CallTreeBuilder treeBuilder =
                    new CallTreeBuilder();

            CallTree tree =
                    treeBuilder.build(trace);

            System.out.println();
            System.out.println(
                    "========== CALL TREE =========="
            );

            if (tree.getRoot() != null) {

                TreePrinter.print(
                        tree.getRoot()
                );

            } else {

                System.out.println(
                        "No call tree generated."
                );
            }

            // ==========================================
            // 5. EXECUTION TIMELINE
            // ==========================================

            ExecutionTimelinePrinter.print(
                    trace
            );

        } catch (Exception e) {

            e.printStackTrace();
        }
    }
}