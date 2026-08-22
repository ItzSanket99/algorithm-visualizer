package com.algotrace.engine;

import com.algotrace.engine.compiler.CompilationResult;
import com.algotrace.engine.compiler.JavaSourceCompiler;
import com.algotrace.engine.debug.DebugLauncher;
import com.algotrace.engine.debug.DebugSession;
import com.algotrace.engine.debug.MethodEventCollector;
import com.algotrace.engine.model.ExecutionTrace;

public class ExecutionEngine {

    private final JavaSourceCompiler compiler;

    private final DebugLauncher debugLauncher;

    public ExecutionEngine() {

        this.compiler =
                new JavaSourceCompiler();

        this.debugLauncher =
                new DebugLauncher();
    }

    public ExecutionTrace execute(
            String sourceCode
    ) throws Exception {

        /*
         * ==========================================
         * 1. COMPILE SOURCE
         * ==========================================
         */

        CompilationResult compilationResult =
                compiler.compile(sourceCode);

        if (!compilationResult.isSuccess()) {

            throw new IllegalArgumentException(
                    "Compilation failed: "
                            + compilationResult
                            .getDiagnostics()
            );
        }

        /*
         * ==========================================
         * 2. START DEBUG JVM
         * ==========================================
         */

        DebugSession session =
                debugLauncher.launch(
                        compilationResult.getClassName()
                );

        /*
         * ==========================================
         * 3. COLLECT EXECUTION TRACE
         * ==========================================
         */

        MethodEventCollector collector =
                new MethodEventCollector(session);

        collector.start();

        /*
         * ==========================================
         * 4. RETURN TRACE
         * ==========================================
         */

        return collector.getExecutionTrace();
    }
}