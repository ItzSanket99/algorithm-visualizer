package com.algotrace.engine.compiler;

import com.algotrace.engine.parser.ClassNameExtractor;
import com.algotrace.engine.util.WorkspaceManager;

import javax.tools.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class JavaSourceCompiler {

    private final JavaCompiler compiler;

    public JavaSourceCompiler() {

        compiler = ToolProvider.getSystemJavaCompiler();

        if (compiler == null) {
            throw new IllegalStateException(
                    "Java Compiler not found. Run using JDK."
            );
        }

    }

    public CompilationResult compile(String sourceCode)
            throws IOException {

        WorkspaceManager.initialize();

        String className =
                ClassNameExtractor.extract(sourceCode);

        Path sourceFile =
                WorkspaceManager.getSourceFile(className);

        Files.writeString(sourceFile, sourceCode);

        DiagnosticCollector<JavaFileObject> diagnostics =
                new DiagnosticCollector<>();

        StandardJavaFileManager fileManager =
                compiler.getStandardFileManager(
                        diagnostics,
                        null,
                        null
                );

        Iterable<? extends JavaFileObject> compilationUnits =
                fileManager.getJavaFileObjects(
                        sourceFile.toFile()
                );

        List<String> options = List.of(
                "-g",
                "-parameters",
                "-d",
                WorkspaceManager.getClassDirectory().toString()
        );

        JavaCompiler.CompilationTask task =
                compiler.getTask(
                        null,
                        fileManager,
                        diagnostics,
                        options,
                        null,
                        compilationUnits
                );

        boolean success = task.call();

        fileManager.close();

        List<String> messages = new ArrayList<>();

        for (Diagnostic<?> diagnostic :
                diagnostics.getDiagnostics()) {

            messages.add(
                    String.format(
                            "Line %d : %s",
                            diagnostic.getLineNumber(),
                            diagnostic.getMessage(null)
                    )
            );

        }

        return new CompilationResult(

                success,

                className,

                sourceFile,

                WorkspaceManager.getClassDirectory(),

                messages

        );

    }

}