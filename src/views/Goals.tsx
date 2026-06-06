import { Edit3, Flag, Plus, Trash2 } from "lucide-react";
import { GoalDialog } from "../components/forms/GoalDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useApp } from "../context/AppContext";
import { goalProgress } from "../lib/finance";
import { currency, formatDate } from "../lib/utils";

export const Goals = () => {
  const { currentProfile, removeGoal } = useApp();
  if (!currentProfile) return null;
  const goals = currentProfile.data.goals;
  const totalTarget = goals.reduce((total, goal) => total + goal.targetAmount, 0);
  const totalCurrent = goals.reduce((total, goal) => total + goal.currentAmount, 0);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Valor objetivo</p>
            <p className="mt-2 text-2xl font-semibold">{currency(totalTarget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Valor acumulado</p>
            <p className="mt-2 text-2xl font-semibold">{currency(totalCurrent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Progresso geral</p>
            <p className="mt-2 text-2xl font-semibold">{totalTarget ? Math.round((totalCurrent / totalTarget) * 100) : 0}%</p>
          </CardContent>
        </Card>
      </section>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Metas cadastradas</h2>
          <p className="text-sm text-muted-foreground">Casa, carro, moto, reserva e qualquer objetivo familiar.</p>
        </div>
        <GoalDialog>
          <Button>
            <Plus className="h-4 w-4" />
            Nova meta
          </Button>
        </GoalDialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map((goal) => {
          const progress = goalProgress(goal);
          return (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ backgroundColor: `${goal.color}22` }}>
                      <Flag className="h-5 w-5" style={{ color: goal.color }} />
                    </span>
                    <div>
                      <CardTitle>{goal.name}</CardTitle>
                      <CardDescription>{goal.targetDate ? `Prazo: ${formatDate(goal.targetDate)}` : "Sem prazo definido"}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={progress >= 100 ? "success" : progress >= 90 ? "warning" : "outline"}>
                    {Math.round(progress)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Progress value={progress} indicatorClassName="bg-teal-500" />
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-muted-foreground">Atual</p>
                    <p className="mt-1 font-semibold">{currency(goal.currentAmount)}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-muted-foreground">Objetivo</p>
                    <p className="mt-1 font-semibold">{currency(goal.targetAmount)}</p>
                  </div>
                </div>
                {goal.notes ? <p className="text-sm text-muted-foreground">{goal.notes}</p> : null}
                <div className="flex justify-end gap-2">
                  <GoalDialog goal={goal}>
                    <Button variant="outline">
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </Button>
                  </GoalDialog>
                  <Button variant="ghost" onClick={() => removeGoal(goal.id)}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!goals.length ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Crie sua primeira meta para acompanhar o progresso mês a mês.
        </div>
      ) : null}
    </div>
  );
};
